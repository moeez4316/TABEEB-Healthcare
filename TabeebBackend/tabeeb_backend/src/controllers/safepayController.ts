import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { SafepayService } from '../services/safepayService';

const prisma = new PrismaClient();

export const createPaymentSession = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.body;
    const patientId = req.user?.uid;

    if (!appointmentId) {
      return res.status(400).json({ success: false, message: 'Appointment ID is required' });
    }

    // 1. Verify appointment exists and belongs to patient
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: true, patient: true, payment: true }
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.patientUid !== patientId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to appointment' });
    }

    if (appointment.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Cannot initiate payment for appointment in ${appointment.status} status` });
    }

    // 2. Anti-Double-Payment Protection (Idempotency)
    // If a session already exists and payment is still UNPAID, return the existing URL
    if (appointment.payment) {
      if (appointment.payment.paymentStatus === 'PAID') {
        return res.status(400).json({ success: false, message: 'Appointment is already paid' });
      }

      if (appointment.payment.safepayCheckoutUrl && appointment.payment.paymentStatus === 'UNPAID') {
        return res.status(200).json({
          success: true,
          redirectUrl: appointment.payment.safepayCheckoutUrl
        });
      }
    }

    // 3. Amount validation
    if (!appointment.consultationFees || appointment.consultationFees.toNumber() === 0) {
      return res.status(400).json({ success: false, message: 'Cannot create payment session for zero-fee appointment' });
    }

    // 4. Create SafePay session
    const amountPKR = appointment.consultationFees.toNumber();
    const session = await SafepayService.createPaymentSession({
      appointmentId,
      amountPKR,
      doctorName: appointment.doctor.name,
      patientEmail: appointment.patient.email || 'patient@example.com'
    });

    // 5. Save tracker and URL to database
    await prisma.appointmentPayment.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        paymentStatus: 'UNPAID',
        paymentMethod: 'safepay',
        safepayTracker: session.tracker,
        safepayCheckoutUrl: session.checkoutUrl
      },
      update: {
        paymentStatus: 'UNPAID',
        paymentMethod: 'safepay',
        safepayTracker: session.tracker,
        safepayCheckoutUrl: session.checkoutUrl
      }
    });

    // 6. Set expiration time on appointment (30 mins from now)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { paymentExpiresAt: expiresAt }
    });

    return res.status(200).json({
      success: true,
      redirectUrl: session.redirectUrl
    });
  } catch (error: any) {
    console.error('Error in createPaymentSession:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create payment session' });
  }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const appointmentId = req.params.appointmentId || req.params.id;
    const patientId = req.user?.uid;

    const payment = await prisma.appointmentPayment.findUnique({
      where: { appointmentId: appointmentId },
      include: { appointment: true }
    });

    if (!payment || payment.appointment.patientUid !== patientId) {
      return res.status(404).json({ success: false, message: 'Payment record not found or unauthorized' });
    }

    if (!payment.safepayTracker) {
      return res.status(400).json({ success: false, message: 'No SafePay tracker found for this appointment' });
    }

    // We only poll SafePay if our local DB doesn't already say PAID
    if (payment.paymentStatus === 'PAID') {
      return res.status(200).json({ success: true, status: 'PAID' });
    }

    // Fetch from SafePay (if it fails, e.g. 404 for V2 trackers, just return local state gracefully)
    let result;
    try {
      result = await SafepayService.verifyPayment(payment.safepayTracker);
    } catch (apiError) {
      console.warn(`SafePay API verify failed, returning local state: ${payment.paymentStatus}`);
      return res.status(200).json({ success: true, status: payment.paymentStatus });
    }

    return res.status(200).json({
      success: true,
      status: result.state // Could be 'PAID', 'UNPAID', etc.
    });
  } catch (error: any) {
    console.error('Error in verifyPayment:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to verify payment' });
  }
};
