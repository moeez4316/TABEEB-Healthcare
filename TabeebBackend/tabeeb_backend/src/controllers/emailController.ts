import { Request, Response } from 'express';
import {
  sendEmail,
  sendAppointmentConfirmation,
  sendAppointmentCancellation,
  sendAppointmentReminder,
  sendVerificationApproved,
  sendVerificationRejected,
  sendPrescriptionReady,
  sendWelcomeEmail,
  sendContactEmail,
} from '../services/emailService';
import prisma from '../lib/prisma';

// ========================================
// SEND TEST EMAIL
// ========================================

export const sendTestEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { to, subject, message } = req.body;

    if (!to) {
      res.status(400).json({ error: 'Recipient email (to) is required' });
      return;
    }

    const result = await sendEmail({
      to,
      subject: subject || 'Test Email from Tabeeb',
      html: `
        <h2>Test Email ✅</h2>
        <p>${message || 'This is a test email from Tabeeb Healthcare.'}</p>
        <p>If you received this, your email setup is working!</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `,
    });

    if (result.success) {
      res.json({ message: 'Test email sent successfully', data: result.data });
    } else {
      res.status(500).json({ error: 'Failed to send email', details: result.error });
    }
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ========================================
// SEND CONTACT FORM EMAIL
// ========================================

export const handleContactForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      res.status(400).json({ error: 'All fields (name, email, subject, message) are required' });
      return;
    }

    // Save to database for admin to see
    await prisma.contactMessage.create({
      data: {
        type: 'CONTACT',
        fromEmail: email,
        fromName: name,
        subject,
        message,
      },
    });

    // Also send notification email to admin
    const result = await sendContactEmail({ from: email, name, subject, message });

    if (result.success) {
      res.json({ message: 'Your message has been sent successfully' });
    } else {
      // Still saved to DB even if email fails
      res.json({ message: 'Your message has been received' });
    }
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
