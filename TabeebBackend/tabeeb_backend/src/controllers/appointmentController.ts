import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { generateAvailableSlots, isSlotAvailable, calculateEndTime, getSlotsStatistics } from '../utils/slotGenerator';
import { sendAppointmentConfirmation, sendAppointmentNotificationToDoctor, sendAppointmentCancellation } from '../services/emailService';
import { publishEvent } from '../realtime/realtime';
import { buildCloudinaryUrl, verifyPublicIdOwnership } from '../services/uploadService';

const emitAppointmentEvent = (params: {
  appointmentId: string;
  doctorUid: string;
  patientUid: string;
  actorRole: 'doctor' | 'patient' | 'admin' | 'system';
  actorUid?: string;
  payload?: Record<string, unknown>;
}) => {
  const users = [params.doctorUid, params.patientUid].filter(Boolean);
  publishEvent({
    type: 'appointment.updated',
    actor: { role: params.actorRole, uid: params.actorUid },
    entity: { type: 'appointment', id: params.appointmentId },
    audience: {
      users,
      roles: ['admin'],
      rooms: [`appointment:${params.appointmentId}`]
    },
    payload: params.payload ?? {}
  });
};

const roundCurrency = (value: number): number => Number(value.toFixed(2));

const clampPercent = (value: number): number => Math.min(100, Math.max(0, Math.round(value)));

type AppointmentPaymentStatus = 'UNPAID' | 'IN_REVIEW' | 'PAID' | 'PAID_TO_DOCTOR' | 'DISPUTED';
type VisiblePaymentStatus = 'UNPAID' | 'IN_PROGRESS' | 'CONFIRMED' | 'DISPUTED';

const PAYMENT_TRANSITIONS: Record<AppointmentPaymentStatus, AppointmentPaymentStatus[]> = {
  UNPAID: ['IN_REVIEW'],
  IN_REVIEW: ['PAID', 'DISPUTED'],
  PAID: ['PAID_TO_DOCTOR'],
  PAID_TO_DOCTOR: [],
  DISPUTED: ['IN_REVIEW'],
};

const prismaWithPayments = prisma as any;

const canTransitionPaymentStatus = (
  currentStatus: AppointmentPaymentStatus,
  nextStatus: AppointmentPaymentStatus
): boolean => PAYMENT_TRANSITIONS[currentStatus]?.includes(nextStatus) ?? false;

const parsePaymentStatus = (value: unknown): AppointmentPaymentStatus | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.toUpperCase();
  const validStatuses: AppointmentPaymentStatus[] = ['UNPAID', 'IN_REVIEW', 'PAID', 'PAID_TO_DOCTOR', 'DISPUTED'];
  return validStatuses.includes(normalized as AppointmentPaymentStatus)
    ? (normalized as AppointmentPaymentStatus)
    : null;
};

const toVisiblePaymentStatus = (status: AppointmentPaymentStatus | undefined): VisiblePaymentStatus => {
  if (status === 'DISPUTED') return 'DISPUTED';
  if (status === 'IN_REVIEW') return 'IN_PROGRESS';
  if (status === 'PAID' || status === 'PAID_TO_DOCTOR') return 'CONFIRMED';
  return 'UNPAID';
};

const parseAppointmentEndDate = (appointmentDate: Date | string, endTime?: string | null): Date => {
  const baseDate = new Date(appointmentDate);
  const [hours, minutes] = String(endTime || '00:00').split(':').map((part) => parseInt(part, 10) || 0);
  const end = new Date(baseDate);
  end.setHours(hours, minutes, 0, 0);
  return end;
};

const buildPaymentWindow = (params: {
  appointmentDate: Date | string;
  endTime?: string | null;
  completedAt?: Date | null;
}) => {
  const now = new Date();
  const anchor = params.completedAt ?? parseAppointmentEndDate(params.appointmentDate, params.endTime);
  const dueAt = new Date(anchor);
  dueAt.setHours(dueAt.getHours() + 24);

  return {
    dueAt,
    now,
    isOverdue: now > dueAt,
    isWindowStarted: now >= anchor,
  };
};

const ensureAppointmentPayment = async (appointmentId: string) => {
  const existing = await prismaWithPayments.appointmentPayment.findUnique({
    where: { appointmentId },
  });

  if (existing) {
    return existing;
  }

  return prismaWithPayments.appointmentPayment.create({
    data: {
      appointmentId,
      paymentStatus: 'UNPAID',
      paymentMethod: 'manual_bank_transfer',
    },
  });
};

const prismaWithFinancialAid = prisma as typeof prisma & {
  patientFinancialAidRequest: {
    findUnique: (args: {
      where: { patientUid: string };
      select: { status: true; requestedDiscountPercent: true };
    }) => Promise<{ status: string; requestedDiscountPercent: number | null } | null>;
  };
};

const getPatientFinancialAidDiscountPercent = async (patientUid: string): Promise<number> => {
  const approvedRequest = await prismaWithFinancialAid.patientFinancialAidRequest.findUnique({
    where: { patientUid },
    select: {
      status: true,
      requestedDiscountPercent: true,
    }
  });

  if (!approvedRequest || approvedRequest.status !== 'APPROVED') {
    return 0;
  }

  const discount = approvedRequest.requestedDiscountPercent ?? 80;

  return clampPercent(discount);
};

const buildAppointmentPricing = (params: {
  baseFee: number;
  isFollowUp: boolean;
  followUpDiscountPercent?: number;
  financialAidDiscountPercent: number;
}) => {
  const baseConsultationFees = roundCurrency(Math.max(0, params.baseFee));

  const followUpDiscountPct = params.isFollowUp
    ? clampPercent(params.followUpDiscountPercent ?? 50)
    : 0;

  const amountAfterFollowUp = roundCurrency(baseConsultationFees * ((100 - followUpDiscountPct) / 100));
  const financialAidDiscountPct = clampPercent(params.financialAidDiscountPercent);
  const finalConsultationFees = roundCurrency(amountAfterFollowUp * ((100 - financialAidDiscountPct) / 100));

  return {
    baseConsultationFees,
    followUpDiscountPct,
    amountAfterFollowUp,
    financialAidDiscountPct,
    finalConsultationFees,
  };
};

// Book appointment (updated to work without TimeSlot)
export const bookAppointment = async (req: Request, res: Response) => {
  try {
    const patientUid = req.user!.uid;
    const { doctorUid, appointmentDate, startTime, patientNotes, sharedDocumentIds } = req.body;

    // Validate required fields
    if (!doctorUid || !appointmentDate || !startTime) {
      return res.status(400).json({ error: 'Doctor UID, appointment date, and start time are required' });
    }

    // Check if appointment date is in the future
    const appointmentDateObj = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (appointmentDateObj < today) {
      return res.status(400).json({ error: 'Cannot book appointments in the past' });
    }

    // Check if appointment is too far in the future (3 months)
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    
    if (appointmentDateObj > threeMonthsFromNow) {
      return res.status(400).json({ error: 'Cannot book appointments more than 3 months in advance' });
    }

    // Get doctor availability for the date
    const availability = await prisma.doctorAvailability.findFirst({
      where: {
        doctorUid,
        date: appointmentDateObj,
        isAvailable: true
      }
    });

    if (!availability) {
      return res.status(400).json({ error: 'Doctor is not available on this date' });
    }

    // Get existing appointments to check slot availability
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorUid,
        appointmentDate: appointmentDateObj,
        status: {
          notIn: ['CANCELLED', 'NO_SHOW']
        }
      },
      select: {
        startTime: true,
        endTime: true
      }
    });

    // Check if the requested slot is available
    if (!isSlotAvailable(startTime, availability, existingAppointments)) {
      const availableSlots = generateAvailableSlots(availability, existingAppointments);
      return res.status(400).json({ 
        error: 'Requested time slot is not available',
        availableSlots: availableSlots.map(slot => slot.startTime)
      });
    }

    // Calculate end time
    const endTime = calculateEndTime(startTime, availability.slotDuration);

    // Get doctor and patient details
    const [doctor, patient] = await Promise.all([
      prisma.doctor.findUnique({
        where: { uid: doctorUid },
        select: {
          name: true,
          email: true,
          specialization: true,
          isActive: true,
          hourlyConsultationRate: true
        }
      }),
      prisma.patient.findUnique({
        where: { uid: patientUid },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          isActive: true
        }
      })
    ]);

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (!doctor.isActive) {
      return res.status(403).json({ error: 'Doctor account is deactivated' });
    }

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!patient.isActive) {
      return res.status(403).json({ error: 'Your account is deactivated' });
    }

    // Calculate base consultation fee from doctor's hourly rate and slot duration
    let baseConsultationFees = 1500; // Default fee PKR 1500
    if (doctor.hourlyConsultationRate) {
      const hourlyRate = parseFloat(doctor.hourlyConsultationRate.toString());
      const durationMultiplier = availability.slotDuration / 60;
      baseConsultationFees = hourlyRate * durationMultiplier;
    }

    // Financial-aid discount is applied after follow-up logic (if any).
    const financialAidDiscountPercent = await getPatientFinancialAidDiscountPercent(patientUid);
    const pricing = buildAppointmentPricing({
      baseFee: baseConsultationFees,
      isFollowUp: false,
      financialAidDiscountPercent,
    });

    // Create appointment
    const appointmentData = {
        doctorUid,
        patientUid,
        appointmentDate: appointmentDateObj,
        startTime,
        endTime,
        duration: availability.slotDuration,
        status: 'PENDING',
        patientNotes,
        consultationFees: pricing.finalConsultationFees,
        baseConsultationFees: pricing.baseConsultationFees,
        followUpDiscountPct: pricing.followUpDiscountPct,
        financialAidDiscountPct: pricing.financialAidDiscountPct,
      } as any;

    const appointment = await prisma.appointment.create({
      data: appointmentData,
      include: {
        doctor: {
          select: {
            name: true,
            specialization: true
          }
        },
        patient: {
          select: {
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });

    // Handle document sharing if provided
    if (sharedDocumentIds && Array.isArray(sharedDocumentIds) && sharedDocumentIds.length > 0) {
      // Validate that documents belong to the patient (Prisma / MySQL)
      const patientDocuments = await prisma.medicalRecord.findMany({
        where: { id: { in: sharedDocumentIds }, userId: patientUid },
        select: { id: true }
      });

      const validDocumentIds = patientDocuments.map(doc => doc.id);

      if (validDocumentIds.length > 0) {
        const sharedDocumentsData = validDocumentIds.map(documentId => ({
          appointmentId: appointment.id,
          documentId,
          sharedBy: patientUid
        }));

        await prisma.appointmentSharedDocument.createMany({
          data: sharedDocumentsData
        });
      }
    }

    res.status(201).json({
      appointment,
      pricing,
      sharedDocumentsCount: sharedDocumentIds?.length || 0,
      message: 'Appointment booked successfully'
    });

    emitAppointmentEvent({
      appointmentId: appointment.id,
      doctorUid: appointment.doctorUid,
      patientUid: appointment.patientUid,
      actorRole: 'patient',
      actorUid: patientUid,
      payload: {
        status: appointment.status,
        action: 'created'
      }
    });

    // Send email notifications asynchronously (don't block the response)
    const formattedDate = appointmentDateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (patient?.email) {
      sendAppointmentConfirmation({
        patientEmail: patient.email,
        patientName: `${patient.firstName} ${patient.lastName}`,
        doctorName: doctor!.name,
        specialization: doctor!.specialization,
        date: formattedDate,
        time: startTime,
        duration: availability.slotDuration,
        appointmentId: appointment.id,
        consultationFees: pricing.finalConsultationFees.toString(),
      }).catch(err => console.error('Failed to send patient confirmation email:', err));
    }

    if (doctor?.email) {
      sendAppointmentNotificationToDoctor({
        doctorEmail: doctor.email,
        doctorName: doctor.name,
        patientName: `${patient!.firstName} ${patient!.lastName}`,
        date: formattedDate,
        time: startTime,
        duration: availability.slotDuration,
        patientNotes,
      }).catch(err => console.error('Failed to send doctor notification email:', err));
    }

  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
};

// Get doctor appointments (updated)
export const getDoctorAppointments = async (req: Request, res: Response) => {
  try {
    const doctorUid = req.user!.uid;
    const { status, date, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100); // Max 100 items per page
    const skip = (pageNum - 1) * limitNum;

    let whereClause: any = { doctorUid };

    if (status) {
      whereClause.status = status;
    }

    if (date) {
      whereClause.appointmentDate = new Date(date as string);
    }

    const [appointments, total] = await Promise.all([
      prismaWithPayments.appointment.findMany({
        where: whereClause,
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              dateOfBirth: true,
              gender: true,
              profileImageUrl: true
            }
          },
          prescriptions: {
            select: {
              prescriptionEndDate: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          },
          payment: {
            select: {
              paymentStatus: true,
              payoutSentAt: true,
              proofUploadedAt: true,
            }
          }
        },
        orderBy: [
          { appointmentDate: 'asc' },
          { startTime: 'asc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.appointment.count({ where: whereClause })
    ]);

    const response = appointments.map((appointment: any) => {
      const paymentStatus = (appointment?.payment?.paymentStatus as AppointmentPaymentStatus | undefined) ?? 'UNPAID';
      const visibleStatus = toVisiblePaymentStatus(paymentStatus);
      return {
        ...appointment,
        doctorPayment: {
          status: visibleStatus,
          isPaidToDoctor: paymentStatus === 'PAID_TO_DOCTOR',
          payoutSentAt: appointment?.payment?.payoutSentAt || null,
          proofUploadedAt: appointment?.payment?.proofUploadedAt || null,
        },
      };
    });

    res.json({
      appointments: response,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Get patient appointments (updated)
export const getPatientAppointments = async (req: Request, res: Response) => {
  try {
    const patientUid = req.user!.uid;
    const { status, upcoming } = req.query;

    let whereClause: any = { patientUid };

    if (status) {
      whereClause.status = status;
    }

    if (upcoming === 'true') {
      whereClause.appointmentDate = {
        gte: new Date()
      };
    }

    const appointments = await prismaWithPayments.appointment.findMany({
      where: whereClause,
      include: {
        doctor: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
            specialization: true,
            qualification: true,
            experience: true,
            profileImageUrl: true
          }
        },
        prescriptions: {
          select: {
            prescriptionEndDate: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        payment: {
          select: {
            paymentStatus: true,
            proofUrl: true,
            proofUploadedAt: true,
            patientReference: true,
            reviewedAt: true,
            reviewNotes: true,
            payoutSentAt: true,
            payoutReference: true,
          }
        }
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { startTime: 'asc' }
      ]
    });

    const response = appointments.map((appointment: any) => {
      const paymentStatus = (appointment?.payment?.paymentStatus as AppointmentPaymentStatus | undefined) ?? 'UNPAID';
      const visibleStatus = toVisiblePaymentStatus(paymentStatus);
      const window = buildPaymentWindow({
        appointmentDate: appointment.appointmentDate,
        endTime: appointment.endTime,
        completedAt: appointment.completedAt ?? null,
      });

      return {
        ...appointment,
        patientPayment: {
          status: visibleStatus,
          isDisputed: paymentStatus === 'DISPUTED',
          isPaidToDoctor: paymentStatus === 'PAID_TO_DOCTOR',
          canPayNow:
            paymentStatus !== 'PAID' &&
            paymentStatus !== 'PAID_TO_DOCTOR' &&
            !appointment?.payment?.proofUploadedAt &&
            !appointment?.payment?.proofUrl,
          dueAt: window.dueAt,
          isOverdue: window.isOverdue,
          isWindowStarted: window.isWindowStarted,
          proofUrl: appointment?.payment?.proofUrl || null,
          proofUploadedAt: appointment?.payment?.proofUploadedAt || null,
          patientReference: appointment?.payment?.patientReference || null,
          reviewedAt: appointment?.payment?.reviewedAt || null,
          reviewNotes: appointment?.payment?.reviewNotes || null,
          payoutSentAt: appointment?.payment?.payoutSentAt || null,
          payoutReference: appointment?.payment?.payoutReference || null,
        },
      };
    });

    res.json(response);

  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Update appointment status
export const updateAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorUid = req.user!.uid;
    const { status, doctorNotes, cancelReason } = req.body;

    // Check if doctor account is active
    const doctor = await prisma.doctor.findUnique({
      where: { uid: doctorUid },
      select: { isActive: true }
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (!doctor.isActive) {
      return res.status(403).json({ error: 'Doctor account is deactivated' });
    }

    // Validate status
    const validStatuses = ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Find appointment
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        doctorUid
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Validate status transition
    if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot update completed or cancelled appointment' });
    }

    if (status === 'CANCELLED' && !cancelReason) {
      return res.status(400).json({ error: 'Cancel reason is required when cancelling appointment' });
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status,
        doctorNotes,
        cancelReason,
        ...(status === 'COMPLETED' && { completedAt: new Date() })
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        doctor: {
          select: {
            name: true,
            specialization: true
          }
        }
      }
    });

    res.json({
      appointment: updatedAppointment,
      message: `Appointment ${status.toLowerCase()} successfully`
    });

    emitAppointmentEvent({
      appointmentId: updatedAppointment.id,
      doctorUid: updatedAppointment.doctorUid,
      patientUid: updatedAppointment.patientUid,
      actorRole: 'doctor',
      actorUid: doctorUid,
      payload: {
        status: updatedAppointment.status,
        action: 'status_updated'
      }
    });

  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ error: 'Failed to update appointment status' });
  }
};

// Cancel appointment
export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userUid = req.user!.uid;
    const { cancelReason } = req.body;

    if (!cancelReason) {
      return res.status(400).json({ error: 'Cancel reason is required' });
    }

    // Check if user account is active (can be doctor or patient)
    const [doctor, patient] = await Promise.all([
      prisma.doctor.findUnique({
        where: { uid: userUid },
        select: { isActive: true }
      }),
      prisma.patient.findUnique({
        where: { uid: userUid },
        select: { isActive: true }
      })
    ]);

    const user = doctor || patient;
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Your account is deactivated' });
    }

    // Find appointment (can be cancelled by patient or doctor)
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        OR: [
          { patientUid: userUid },
          { doctorUid: userUid }
        ]
      },
      include: {
        doctor: { select: { name: true, email: true } },
        patient: { select: { firstName: true, lastName: true, email: true } }
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot cancel completed or already cancelled appointment' });
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelReason
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        doctor: {
          select: {
            name: true
          }
        }
      }
    });

    const cancelledBy = userUid === appointment.doctorUid ? 'doctor' : 'patient';
    const formattedDate = appointment.appointmentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    res.json({
      appointment: updatedAppointment,
      message: 'Appointment cancelled successfully'
    });

    emitAppointmentEvent({
      appointmentId: updatedAppointment.id,
      doctorUid: updatedAppointment.doctorUid,
      patientUid: updatedAppointment.patientUid,
      actorRole: cancelledBy === 'doctor' ? 'doctor' : 'patient',
      actorUid: userUid,
      payload: {
        status: updatedAppointment.status,
        action: 'cancelled'
      }
    });

    // Send cancellation emails asynchronously
    const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;
    const doctorName = appointment.doctor.name;

    if (appointment.patient.email) {
      sendAppointmentCancellation({
        email: appointment.patient.email,
        recipientName: patientName,
        doctorName,
        patientName,
        date: formattedDate,
        time: appointment.startTime,
        cancelReason,
        cancelledBy,
      }).catch(err => console.error('Failed to send patient cancellation email:', err));
    }

    if (appointment.doctor.email) {
      sendAppointmentCancellation({
        email: appointment.doctor.email,
        recipientName: `Dr. ${doctorName}`,
        doctorName,
        patientName,
        date: formattedDate,
        time: appointment.startTime,
        cancelReason,
        cancelledBy,
      }).catch(err => console.error('Failed to send doctor cancellation email:', err));
    }

  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
};

// Get appointment details
export const getAppointmentDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userUid = req.user!.uid;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        OR: [
          { patientUid: userUid },
          { doctorUid: userUid }
        ]
      },
      include: {
        doctor: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
            specialization: true,
            qualification: true,
            experience: true,
            profileImageUrl: true
          }
        },
        patient: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            profileImageUrl: true
          }
        }
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(appointment);

  } catch (error) {
    console.error('Error fetching appointment details:', error);
    res.status(500).json({ error: 'Failed to fetch appointment details' });
  }
};

// Get appointment statistics
export const getAppointmentStats = async (req: Request, res: Response) => {
  try {
    const doctorUid = req.user!.uid;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());

    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

    const [total, todayCount, upcoming, pending, completed, thisWeek] = await Promise.all([
      prisma.appointment.count({
        where: { doctorUid }
      }),
      prisma.appointment.count({
        where: {
          doctorUid,
          appointmentDate: today,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] }
        }
      }),
      prisma.appointment.count({
        where: {
          doctorUid,
          appointmentDate: { gte: today },
          status: { notIn: ['CANCELLED', 'NO_SHOW', 'COMPLETED'] }
        }
      }),
      prisma.appointment.count({
        where: {
          doctorUid,
          status: 'PENDING'
        }
      }),
      prisma.appointment.count({
        where: {
          doctorUid,
          status: 'COMPLETED'
        }
      }),
      prisma.appointment.count({
        where: {
          doctorUid,
          appointmentDate: {
            gte: thisWeekStart,
            lte: thisWeekEnd
          },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] }
        }
      })
    ]);

    res.json({
      total,
      today: todayCount,
      upcoming,
      pending,
      completed,
      thisWeek
    });

  } catch (error) {
    console.error('Error fetching appointment statistics:', error);
    res.status(500).json({ error: 'Failed to fetch appointment statistics' });
  }
};

// Share documents with appointment
export const shareDocumentsWithAppointment = async (req: Request, res: Response) => {
  try {
    const { id: appointmentId } = req.params;
    const patientUid = req.user!.uid;
    const { documentIds } = req.body;

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({ error: 'Document IDs array is required' });
    }

    // Verify appointment belongs to patient
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patientUid
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Validate that documents belong to the patient (Prisma / MySQL)
    const patientDocuments = await prisma.medicalRecord.findMany({
      where: { id: { in: documentIds }, userId: patientUid },
      select: { id: true }
    });

    const validDocumentIds = patientDocuments.map(doc => doc.id);
    
    if (validDocumentIds.length === 0) {
      return res.status(400).json({ error: 'No valid documents found' });
    }

    // Create shared document records (avoid duplicates)
    const sharedDocumentsData = validDocumentIds.map(documentId => ({
      appointmentId,
      documentId,
      sharedBy: patientUid
    }));

    const result = await prisma.appointmentSharedDocument.createMany({
      data: sharedDocumentsData,
      skipDuplicates: true
    });

    res.status(201).json({
      message: 'Documents shared successfully',
      sharedCount: result.count,
      validDocumentsCount: validDocumentIds.length
    });

    emitAppointmentEvent({
      appointmentId,
      doctorUid: appointment.doctorUid,
      patientUid: appointment.patientUid,
      actorRole: 'patient',
      actorUid: patientUid,
      payload: {
        action: 'documents_shared',
        sharedCount: result.count
      }
    });

  } catch (error) {
    console.error('Error sharing documents:', error);
    res.status(500).json({ error: 'Failed to share documents' });
  }
};

// Unshare document from appointment
export const unshareDocumentFromAppointment = async (req: Request, res: Response) => {
  try {
    const { id: appointmentId, documentId } = req.params;
    const patientUid = req.user!.uid;

    // Find and delete the shared document record
    const deletedRecord = await prisma.appointmentSharedDocument.deleteMany({
      where: {
        appointmentId,
        documentId,
        sharedBy: patientUid
      }
    });

    if (deletedRecord.count === 0) {
      return res.status(404).json({ error: 'Shared document not found' });
    }

    res.json({ message: 'Document unshared successfully' });

  } catch (error) {
    console.error('Error unsharing document:', error);
    res.status(500).json({ error: 'Failed to unshare document' });
  }
};

// Get shared documents for appointment
export const getAppointmentSharedDocuments = async (req: Request, res: Response) => {
  try {
    const { id: appointmentId } = req.params;
    const userUid = req.user!.uid;

    // Verify user has access to this appointment
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        OR: [
          { patientUid: userUid },
          { doctorUid: userUid }
        ]
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Get shared documents
    const sharedDocuments = await prisma.appointmentSharedDocument.findMany({
      where: {
        appointmentId,
        isVisible: true
      },
      select: {
        id: true,
        documentId: true,
        sharedAt: true,
        sharedBy: true
      }
    });

    // Fetch medical record details from MySQL via Prisma
    let documentsWithDetails: any[] = [];
    let unavailableCount = 0;
    if (sharedDocuments.length > 0) {
      const documentIds = sharedDocuments.map((doc: any) => doc.documentId);

      const medicalRecords = await prisma.medicalRecord.findMany({
        where: { id: { in: documentIds } },
        select: { id: true, fileUrl: true, fileType: true, tags: true, notes: true, uploadedAt: true }
      });

      documentsWithDetails = sharedDocuments.map((sharedDoc: any) => {
        const medicalRecord = medicalRecords.find(
          (record: any) => record.id === sharedDoc.documentId
        );

        if (!medicalRecord) {
          unavailableCount += 1;
          return null;
        }

        return {
          sharedDocumentId: sharedDoc.id,
          documentId: sharedDoc.documentId,
          sharedAt: sharedDoc.sharedAt,
          sharedBy: sharedDoc.sharedBy,
          fileUrl: medicalRecord.fileUrl,
          fileType: medicalRecord.fileType,
          tags: medicalRecord.tags ? medicalRecord.tags.split(',').map((t: string) => t.trim()) : [],
          notes: medicalRecord.notes,
          uploadedAt: medicalRecord.uploadedAt
        };
      }).filter(Boolean) as any[];
    }

    res.json({
      appointmentId,
      sharedDocuments: documentsWithDetails,
      totalCount: documentsWithDetails.length,
      unavailableCount
    });

  } catch (error) {
    console.error('Error fetching shared documents:', error);
    res.status(500).json({ error: 'Failed to fetch shared documents' });
  }
};

// Confirm payment for appointment (manual transfer flow)
export const confirmAppointmentPayment = async (req: Request, res: Response) => {
  try {
    const patientUid = req.user!.uid;
    const { appointmentId } = req.params;
    const { paymentMethod } = req.body;

    // Validate appointment exists and belongs to patient
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.patientUid !== patientUid) {
      return res.status(403).json({ error: 'You can only confirm payment for your own appointment' });
    }

    const existingPayment = await ensureAppointmentPayment(appointmentId);
    const currentStatus = (existingPayment.paymentStatus || 'UNPAID') as AppointmentPaymentStatus;

    if (!canTransitionPaymentStatus(currentStatus, 'IN_REVIEW') && currentStatus !== 'IN_REVIEW') {
      return res.status(400).json({
        error: `Cannot confirm payment while status is ${currentStatus}`,
      });
    }

    const paymentRecord = await prismaWithPayments.appointmentPayment.update({
      where: { appointmentId },
      data: {
        paymentMethod: typeof paymentMethod === 'string' && paymentMethod.trim().length > 0
          ? paymentMethod.trim()
          : 'manual_bank_transfer',
        paymentStatus: 'IN_REVIEW',
      },
    });

    res.json({
      success: true,
      message: 'Payment marked for review. Please upload proof for faster verification.',
      payment: paymentRecord,
    });

    emitAppointmentEvent({
      appointmentId,
      doctorUid: appointment.doctorUid,
      patientUid: appointment.patientUid,
      actorRole: 'patient',
      actorUid: req.user?.uid,
      payload: {
        action: 'payment_confirmed',
        paymentStatus: 'IN_REVIEW'
      }
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
};

export const submitAppointmentPaymentProof = async (req: Request, res: Response) => {
  try {
    const patientUid = req.user!.uid;
    const { appointmentId } = req.params;
    const { publicId, resourceType } = req.body;

    if (!publicId || typeof publicId !== 'string') {
      return res.status(400).json({ error: 'publicId is required' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.patientUid !== patientUid) {
      return res.status(403).json({ error: 'You can only submit proof for your own appointment' });
    }

    const isOwner = verifyPublicIdOwnership(publicId, patientUid, 'payment-proof' as any);
    if (!isOwner) {
      return res.status(403).json({ error: 'Uploaded file does not belong to this user' });
    }

    const payment = await ensureAppointmentPayment(appointmentId);
    const currentStatus = (payment.paymentStatus || 'UNPAID') as AppointmentPaymentStatus;

    if (payment.proofUploadedAt || payment.proofUrl) {
      return res.status(409).json({ error: 'Payment proof has already been submitted for this appointment' });
    }

    if (!canTransitionPaymentStatus(currentStatus, 'IN_REVIEW') && currentStatus !== 'IN_REVIEW') {
      return res.status(400).json({
        error: `Cannot upload proof while status is ${currentStatus}`,
      });
    }

    const normalizedResourceType = resourceType === 'raw' || resourceType === 'video' ? resourceType : 'image';
    const proofUrl = buildCloudinaryUrl(publicId, normalizedResourceType);

    const updated = await prismaWithPayments.appointmentPayment.update({
      where: { appointmentId },
      data: {
        proofUrl,
        proofUploadedAt: new Date(),
        paymentStatus: 'IN_REVIEW',
      },
    });

    res.json({
      success: true,
      message: 'Payment proof uploaded and submitted for admin review',
      payment: updated,
    });

    emitAppointmentEvent({
      appointmentId,
      doctorUid: appointment.doctorUid,
      patientUid: appointment.patientUid,
      actorRole: 'patient',
      actorUid: patientUid,
      payload: {
        action: 'payment_proof_submitted',
        paymentStatus: 'IN_REVIEW',
      },
    });
  } catch (error) {
    console.error('Error submitting payment proof:', error);
    res.status(500).json({ error: 'Failed to submit payment proof' });
  }
};

export const getAppointmentPaymentStatus = async (req: Request, res: Response) => {
  try {
    const userUid = req.user!.uid;
    const { appointmentId } = req.params;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        OR: [{ patientUid: userUid }, { doctorUid: userUid }],
      },
      select: {
        id: true,
        patientUid: true,
        doctorUid: true,
        consultationFees: true,
        appointmentDate: true,
        endTime: true,
        completedAt: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const payment = await prismaWithPayments.appointmentPayment.findUnique({
      where: { appointmentId },
    });
    const currentStatus = (payment?.paymentStatus as AppointmentPaymentStatus | undefined) ?? 'UNPAID';
    const visibleStatus = toVisiblePaymentStatus(currentStatus);
    const window = buildPaymentWindow({
      appointmentDate: appointment.appointmentDate,
      endTime: (appointment as any).endTime,
      completedAt: (appointment as any).completedAt ?? null,
    });

    const isPatientViewer = appointment.patientUid === userUid;
    const isDoctorViewer = appointment.doctorUid === userUid;

    if (isPatientViewer) {
      return res.json({
        appointmentId,
        payment: {
          status: visibleStatus,
          isDisputed: currentStatus === 'DISPUTED',
          canPayNow:
            currentStatus !== 'PAID' &&
            currentStatus !== 'PAID_TO_DOCTOR' &&
            !payment?.proofUploadedAt &&
            !payment?.proofUrl,
          dueAt: window.dueAt,
          isOverdue: window.isOverdue,
          isWindowStarted: window.isWindowStarted,
          proofUrl: payment?.proofUrl || null,
          proofUploadedAt: payment?.proofUploadedAt || null,
        },
      });
    }

    if (isDoctorViewer) {
      return res.json({
        appointmentId,
        payment: {
          status: visibleStatus,
          isPaidToDoctor: currentStatus === 'PAID_TO_DOCTOR',
          dueAt: window.dueAt,
          payoutSentAt: payment?.payoutSentAt || null,
        },
      });
    }

    return res.json({
      appointmentId,
      payment: payment || {
        appointmentId,
        paymentStatus: 'UNPAID',
        paymentMethod: 'manual_bank_transfer',
        proofUrl: null,
        proofUploadedAt: null,
        patientReference: null,
      },
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
};

export const getAppointmentPaymentsForAdmin = async (req: Request, res: Response) => {
  try {
    const { status, search = '', page = 1, limit = 20, overdueUnpaid } = req.query;
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const isOverdueUnpaidOnly = ['true', '1', 'yes'].includes(String(overdueUnpaid || '').toLowerCase());

    const where: any = {};
    const parsedStatus = parsePaymentStatus(status);
    if (parsedStatus) {
      where.paymentStatus = parsedStatus;
    }
    if (isOverdueUnpaidOnly) {
      where.paymentStatus = 'UNPAID';
    }

    const query = String(search).trim();
    if (query.length > 0) {
      where.OR = [
        { appointmentId: { contains: query } },
        {
          appointment: {
            patient: {
              OR: [
                { firstName: { contains: query } },
                { lastName: { contains: query } },
                { email: { contains: query } },
              ],
            },
          },
        },
        {
          appointment: {
            doctor: {
              OR: [
                { firstName: { contains: query } },
                { lastName: { contains: query } },
                { name: { contains: query } },
              ],
            },
          },
        },
      ];
    }

    const orderBy = [{ updatedAt: 'desc' }, { createdAt: 'desc' }] as const;
    const fetchArgs: any = {
      where,
      include: {
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            startTime: true,
            endTime: true,
            completedAt: true,
            consultationFees: true,
            status: true,
            patient: {
              select: {
                uid: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
            doctor: {
              select: {
                uid: true,
                firstName: true,
                lastName: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy,
    };

    if (!isOverdueUnpaidOnly) {
      fetchArgs.skip = skip;
      fetchArgs.take = limitNum;
    }

    const fetchedPayments = await prismaWithPayments.appointmentPayment.findMany(fetchArgs);

    const overdueFilteredPayments = isOverdueUnpaidOnly
      ? fetchedPayments.filter((payment: any) => {
          const window = buildPaymentWindow({
            appointmentDate: payment.appointment.appointmentDate,
            endTime: payment.appointment.endTime,
            completedAt: payment.appointment.completedAt ?? null,
          });
          return window.isOverdue;
        })
      : fetchedPayments;

    const payments = isOverdueUnpaidOnly ? overdueFilteredPayments.slice(skip, skip + limitNum) : overdueFilteredPayments;
    const total = isOverdueUnpaidOnly
      ? overdueFilteredPayments.length
      : await prismaWithPayments.appointmentPayment.count({ where });

    const [unpaid, inReview, paid, paidToDoctor, disputed, overdueUnpaidCountSource] = await Promise.all([
      prismaWithPayments.appointmentPayment.count({ where: { paymentStatus: 'UNPAID' } }),
      prismaWithPayments.appointmentPayment.count({ where: { paymentStatus: 'IN_REVIEW' } }),
      prismaWithPayments.appointmentPayment.count({ where: { paymentStatus: 'PAID' } }),
      prismaWithPayments.appointmentPayment.count({ where: { paymentStatus: 'PAID_TO_DOCTOR' } }),
      prismaWithPayments.appointmentPayment.count({ where: { paymentStatus: 'DISPUTED' } }),
      prismaWithPayments.appointmentPayment.findMany({
        where: { paymentStatus: 'UNPAID' },
        select: {
          appointment: {
            select: {
              appointmentDate: true,
              endTime: true,
              completedAt: true,
            },
          },
        },
      }),
    ]);

    const overdueUnpaidCount = overdueUnpaidCountSource.filter((payment: any) => {
      const window = buildPaymentWindow({
        appointmentDate: payment.appointment.appointmentDate,
        endTime: payment.appointment.endTime,
        completedAt: payment.appointment.completedAt ?? null,
      });
      return window.isOverdue;
    }).length;

    return res.json({
      payments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      counts: {
        unpaid,
        inReview,
        paid,
        paidToDoctor,
        disputed,
        overdueUnpaid: overdueUnpaidCount,
      },
    });
  } catch (error) {
    console.error('Error fetching appointment payments for admin:', error);
    res.status(500).json({ error: 'Failed to fetch appointment payments' });
  }
};

export const reviewAppointmentPaymentByAdmin = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { status, reviewNotes } = req.body;
    const admin = (req as any).admin;
    const nextStatus = parsePaymentStatus(status);

    if (!nextStatus || !['PAID', 'DISPUTED', 'IN_REVIEW'].includes(nextStatus)) {
      return res.status(400).json({ error: 'Status must be one of: PAID, DISPUTED, IN_REVIEW' });
    }

    const existing = await ensureAppointmentPayment(appointmentId);
    const currentStatus = (existing.paymentStatus || 'UNPAID') as AppointmentPaymentStatus;

    if (!canTransitionPaymentStatus(currentStatus, nextStatus) && currentStatus !== nextStatus) {
      return res.status(400).json({
        error: `Invalid status transition from ${currentStatus} to ${nextStatus}`,
      });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { doctorUid: true, patientUid: true },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const updated = await prismaWithPayments.appointmentPayment.update({
      where: { appointmentId },
      data: {
        paymentStatus: nextStatus,
        reviewedByAdminId: admin?.id || null,
        reviewedAt: new Date(),
        reviewNotes: typeof reviewNotes === 'string' && reviewNotes.trim().length > 0 ? reviewNotes.trim() : null,
      },
    });

    res.json({
      success: true,
      message: `Payment marked as ${nextStatus}`,
      payment: updated,
    });

    emitAppointmentEvent({
      appointmentId,
      doctorUid: appointment.doctorUid,
      patientUid: appointment.patientUid,
      actorRole: 'admin',
      actorUid: admin?.id,
      payload: {
        action: 'payment_reviewed',
        paymentStatus: nextStatus,
      },
    });
  } catch (error) {
    console.error('Error reviewing appointment payment:', error);
    res.status(500).json({ error: 'Failed to review appointment payment' });
  }
};

export const markAppointmentPaymentPaidToDoctorByAdmin = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const { payoutReference } = req.body;
    const admin = (req as any).admin;

    const payment = await ensureAppointmentPayment(appointmentId);
    const currentStatus = (payment.paymentStatus || 'UNPAID') as AppointmentPaymentStatus;
    if (!canTransitionPaymentStatus(currentStatus, 'PAID_TO_DOCTOR')) {
      return res.status(400).json({
        error: `Payment must be PAID before marking payout. Current status: ${currentStatus}`,
      });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { doctorUid: true, patientUid: true },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const updated = await prismaWithPayments.appointmentPayment.update({
      where: { appointmentId },
      data: {
        paymentStatus: 'PAID_TO_DOCTOR',
        payoutReference:
          typeof payoutReference === 'string' && payoutReference.trim().length > 0
            ? payoutReference.trim()
            : null,
        payoutSentByAdminId: admin?.id || null,
        payoutSentAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Payment marked as paid to doctor',
      payment: updated,
    });

    emitAppointmentEvent({
      appointmentId,
      doctorUid: appointment.doctorUid,
      patientUid: appointment.patientUid,
      actorRole: 'admin',
      actorUid: admin?.id,
      payload: {
        action: 'payment_paid_to_doctor',
        paymentStatus: 'PAID_TO_DOCTOR',
      },
    });
  } catch (error) {
    console.error('Error marking payment paid to doctor:', error);
    res.status(500).json({ error: 'Failed to mark payment paid to doctor' });
  }
};

export const getAppointmentPaymentRevenueSummaryForAdmin = async (_req: Request, res: Response) => {
  try {
    const payments = await prismaWithPayments.appointmentPayment.findMany({
      where: {
        paymentStatus: {
          in: ['PAID', 'PAID_TO_DOCTOR'],
        },
      },
      include: {
        appointment: {
          select: {
            consultationFees: true,
          },
        },
      },
    });

    const totalRevenue = payments.reduce((sum: number, payment: any) => {
      const fee = payment?.appointment?.consultationFees;
      if (fee === null || fee === undefined) return sum;
      const numeric = typeof fee === 'number' ? fee : parseFloat(String(fee));
      return Number.isFinite(numeric) ? sum + numeric : sum;
    }, 0);

    const [unpaid, inReview, paid, paidToDoctor, disputed] = await Promise.all([
      prismaWithPayments.appointmentPayment.count({ where: { paymentStatus: 'UNPAID' } }),
      prismaWithPayments.appointmentPayment.count({ where: { paymentStatus: 'IN_REVIEW' } }),
      prismaWithPayments.appointmentPayment.count({ where: { paymentStatus: 'PAID' } }),
      prismaWithPayments.appointmentPayment.count({ where: { paymentStatus: 'PAID_TO_DOCTOR' } }),
      prismaWithPayments.appointmentPayment.count({ where: { paymentStatus: 'DISPUTED' } }),
    ]);

    return res.json({
      totalRevenue: Number(totalRevenue.toFixed(2)),
      counts: {
        unpaid,
        inReview,
        paid,
        paidToDoctor,
        disputed,
      },
    });
  } catch (error) {
    console.error('Error fetching payment revenue summary:', error);
    res.status(500).json({ error: 'Failed to fetch payment revenue summary' });
  }
};

// Check follow-up eligibility for a patient with a specific doctor
export const checkFollowUpEligibility = async (req: Request, res: Response) => {
  try {
    const patientUid = req.user!.uid;
    const { doctorUid } = req.params;

    if (!doctorUid) {
      return res.status(400).json({ error: 'Doctor UID is required' });
    }

    // Get all completed appointments with this doctor, ordered by completion date
    const completedAppointments = await prisma.appointment.findMany({
      where: {
        patientUid,
        doctorUid,
        status: 'COMPLETED'
      },
      orderBy: { completedAt: 'desc' },
      include: {
        prescriptions: {
          where: { isActive: true },
          orderBy: { prescriptionEndDate: 'desc' },
          take: 1
        }
      }
    });

    if (completedAppointments.length === 0) {
      return res.json({
        eligible: false,
        reason: 'No previous completed appointment with this doctor'
      });
    }

    // Find the latest appointment in the chain that doesn't have a follow-up yet
    // This allows: Original A → Follow-up B → Follow-up C (chain)
    // But prevents: Original A having multiple follow-ups
    let eligibleAppointment = null;

    for (const appointment of completedAppointments) {
      // Check if this appointment already has a follow-up (any status except CANCELLED)
      const existingFollowUp = await prisma.appointment.findFirst({
        where: {
          originalAppointmentId: appointment.id,
          status: { notIn: ['CANCELLED'] }
        }
      });

      if (!existingFollowUp) {
        // This appointment doesn't have a follow-up yet - it's eligible
        eligibleAppointment = appointment;
        break; // Take the most recent one
      }
    }

    if (!eligibleAppointment) {
      return res.json({
        eligible: false,
        reason: 'All completed appointments already have follow-ups scheduled'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Determine eligibility window based on prescription
    let eligibilityEndDate: Date;
    
    if (eligibleAppointment.prescriptions.length > 0 && eligibleAppointment.prescriptions[0].prescriptionEndDate) {
      // If there's a prescription, follow-up window is prescription end + 3 days
      eligibilityEndDate = new Date(eligibleAppointment.prescriptions[0].prescriptionEndDate);
      eligibilityEndDate.setDate(eligibilityEndDate.getDate() + 3);
    } else {
      // If no prescription, follow-up window is 3 days after appointment completion
      eligibilityEndDate = new Date(eligibleAppointment.completedAt || eligibleAppointment.updatedAt);
      eligibilityEndDate.setDate(eligibilityEndDate.getDate() + 3);
    }

    const isEligible = today <= eligibilityEndDate;

    // Get doctor's follow-up percentage
    const doctor = await prisma.doctor.findUnique({
      where: { uid: doctorUid },
      select: { 
        followUpPercentage: true,
        hourlyConsultationRate: true,
        name: true
      }
    });

    return res.json({
      eligible: isEligible,
      originalAppointmentId: eligibleAppointment.id,
      isChainedFollowUp: eligibleAppointment.isFollowUp, // Let frontend know if this is a follow-up of a follow-up
      eligibilityEndDate: eligibilityEndDate.toISOString().split('T')[0],
      daysRemaining: isEligible ? Math.ceil((eligibilityEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0,
      followUpPercentage: doctor?.followUpPercentage ?? 50,
      originalFee: doctor?.hourlyConsultationRate ? parseFloat(doctor.hourlyConsultationRate.toString()) : null,
      reason: isEligible 
        ? `You are eligible for a follow-up appointment until ${eligibilityEndDate.toLocaleDateString()}`
        : 'Follow-up eligibility window has expired'
    });

  } catch (error) {
    console.error('Error checking follow-up eligibility:', error);
    res.status(500).json({ error: 'Failed to check follow-up eligibility' });
  }
};

// Book follow-up appointment with discounted fees
export const bookFollowUpAppointment = async (req: Request, res: Response) => {
  try {
    const patientUid = req.user!.uid;
    const { doctorUid, appointmentDate, startTime, patientNotes, originalAppointmentId } = req.body;

    // Validate required fields
    if (!doctorUid || !appointmentDate || !startTime || !originalAppointmentId) {
      return res.status(400).json({ error: 'Doctor UID, appointment date, start time, and original appointment ID are required' });
    }

    // Verify the original appointment exists and patient is eligible
    const originalAppointment = await prisma.appointment.findFirst({
      where: {
        id: originalAppointmentId,
        patientUid,
        doctorUid,
        status: 'COMPLETED'
      },
      include: {
        prescriptions: {
          where: { isActive: true },
          orderBy: { prescriptionEndDate: 'desc' },
          take: 1
        }
      }
    });

    if (!originalAppointment) {
      return res.status(400).json({ error: 'Invalid original appointment or not eligible for follow-up' });
    }

    // Check if a follow-up has already been created for this appointment
    const existingFollowUp = await prisma.appointment.findFirst({
      where: {
        originalAppointmentId: originalAppointmentId,
        status: { notIn: ['CANCELLED'] }
      }
    });

    if (existingFollowUp) {
      return res.status(400).json({ error: 'A follow-up appointment has already been booked for this consultation' });
    }

    // Check eligibility window
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let eligibilityEndDate: Date;
    if (originalAppointment.prescriptions.length > 0 && originalAppointment.prescriptions[0].prescriptionEndDate) {
      eligibilityEndDate = new Date(originalAppointment.prescriptions[0].prescriptionEndDate);
      eligibilityEndDate.setDate(eligibilityEndDate.getDate() + 3);
    } else {
      eligibilityEndDate = new Date(originalAppointment.completedAt || originalAppointment.updatedAt);
      eligibilityEndDate.setDate(eligibilityEndDate.getDate() + 3);
    }

    if (today > eligibilityEndDate) {
      return res.status(400).json({ error: 'Follow-up eligibility window has expired' });
    }

    // Get doctor details and availability
    const appointmentDateObj = new Date(appointmentDate);
    
    const [doctor, availability] = await Promise.all([
      prisma.doctor.findUnique({
        where: { uid: doctorUid },
        select: {
          name: true,
          specialization: true,
          isActive: true,
          hourlyConsultationRate: true,
          followUpPercentage: true
        }
      }),
      prisma.doctorAvailability.findFirst({
        where: {
          doctorUid,
          date: appointmentDateObj,
          isAvailable: true
        }
      })
    ]);

    if (!doctor || !doctor.isActive) {
      return res.status(404).json({ error: 'Doctor not found or inactive' });
    }

    if (!availability) {
      return res.status(400).json({ error: 'Doctor is not available on this date' });
    }

    // Check slot availability
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorUid,
        appointmentDate: appointmentDateObj,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] }
      },
      select: { startTime: true, endTime: true }
    });

    if (!isSlotAvailable(startTime, availability, existingAppointments)) {
      return res.status(400).json({ error: 'Requested time slot is not available' });
    }

    // Calculate final fee by applying follow-up first, then financial-aid discount.
    const endTime = calculateEndTime(startTime, availability.slotDuration);
    let baseConsultationFees = 1500; // Default
    const followUpDiscountPercent = doctor.followUpPercentage ?? 50;
    
    if (doctor.hourlyConsultationRate) {
      const hourlyRate = parseFloat(doctor.hourlyConsultationRate.toString());
      const durationMultiplier = availability.slotDuration / 60;
      baseConsultationFees = hourlyRate * durationMultiplier;
    }

    const financialAidDiscountPercent = await getPatientFinancialAidDiscountPercent(patientUid);
    const pricing = buildAppointmentPricing({
      baseFee: baseConsultationFees,
      isFollowUp: true,
      followUpDiscountPercent,
      financialAidDiscountPercent,
    });

    // Create follow-up appointment
    const followUpAppointmentData = {
        doctorUid,
        patientUid,
        appointmentDate: appointmentDateObj,
        startTime,
        endTime,
        duration: availability.slotDuration,
        status: 'PENDING',
        patientNotes,
        consultationFees: pricing.finalConsultationFees,
        baseConsultationFees: pricing.baseConsultationFees,
        followUpDiscountPct: pricing.followUpDiscountPct,
        financialAidDiscountPct: pricing.financialAidDiscountPct,
        isFollowUp: true,
        originalAppointmentId
      } as any;

    const appointment = await prisma.appointment.create({
      data: followUpAppointmentData,
      include: {
        doctor: { select: { name: true, specialization: true } },
        patient: { select: { firstName: true, lastName: true, phone: true } }
      }
    });

    res.status(201).json({
      appointment,
      isFollowUp: true,
      discountApplied: pricing.followUpDiscountPct,
      pricing,
      message: `Follow-up appointment booked successfully with ${pricing.followUpDiscountPct}% follow-up discount${pricing.financialAidDiscountPct > 0 ? ` and ${pricing.financialAidDiscountPct}% financial-aid discount` : ''}`
    });

    emitAppointmentEvent({
      appointmentId: appointment.id,
      doctorUid: appointment.doctorUid,
      patientUid: appointment.patientUid,
      actorRole: 'patient',
      actorUid: patientUid,
      payload: {
        status: appointment.status,
        action: 'follow_up_created',
        isFollowUp: true
      }
    });

  } catch (error) {
    console.error('Error booking follow-up:', error);
    res.status(500).json({ error: 'Failed to book follow-up appointment' });
  }
};
