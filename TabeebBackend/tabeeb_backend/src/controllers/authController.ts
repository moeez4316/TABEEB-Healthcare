import { Request, Response } from 'express';
import admin from '../config/firebase';
import prisma from '../lib/prisma';
import { generateOtp, verifyOtp } from '../services/otpService';
import { sendOtpEmail, sendPasswordChangedEmail } from '../services/emailService';

const FRONTEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '').replace(':5002', ':3000') || 'http://localhost:3000';

// ========================================
// SEND OTP (for email verification or password reset)
// ========================================

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, type } = req.body;

    if (!email || !type) {
      res.status(400).json({ error: 'Email and type are required.' });
      return;
    }

    if (!['EMAIL_VERIFY', 'PASSWORD_RESET'].includes(type)) {
      res.status(400).json({ error: 'Invalid OTP type. Must be EMAIL_VERIFY or PASSWORD_RESET.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // For password reset, verify the user exists in Firebase
    if (type === 'PASSWORD_RESET') {
      try {
        await admin.auth().getUserByEmail(normalizedEmail);
      } catch {
        // Don't reveal if user exists or not — still return success
        res.json({ message: 'If an account exists with this email, a reset code has been sent.' });
        return;
      }
    }

    // Generate OTP
    const result = await generateOtp(normalizedEmail, type);

    if (result.error) {
      res.status(429).json({ error: result.error });
      return;
    }

    // Lookup user name for personalization
    let name: string | undefined;
    try {
      const firebaseUser = await admin.auth().getUserByEmail(normalizedEmail);
      name = firebaseUser.displayName || undefined;
    } catch {
      // User might not exist yet (email verification during signup)
    }

    // Send OTP email
    const emailResult = await sendOtpEmail({
      email: normalizedEmail,
      code: result.code,
      type,
      name,
      frontendUrl: FRONTEND_URL,
    });

    if (!emailResult.success) {
      console.error('Failed to send OTP email:', emailResult.error);
      res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
      return;
    }

    res.json({ message: 'Verification code sent to your email.' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};

// ========================================
// VERIFY OTP
// ========================================

export const verifyOtpCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, type } = req.body;

    if (!email || !code || !type) {
      res.status(400).json({ error: 'Email, code, and type are required.' });
      return;
    }

    if (!['EMAIL_VERIFY', 'PASSWORD_RESET'].includes(type)) {
      res.status(400).json({ error: 'Invalid OTP type.' });
      return;
    }

    const result = await verifyOtp(email.toLowerCase().trim(), code, type);

    if (!result.valid) {
      res.status(400).json({ error: result.error });
      return;
    }

    // If verifying email, set emailVerified in Firebase
    if (type === 'EMAIL_VERIFY') {
      try {
        const firebaseUser = await admin.auth().getUserByEmail(email.toLowerCase().trim());
        await admin.auth().updateUser(firebaseUser.uid, { emailVerified: true });
      } catch (err) {
        console.error('Failed to set emailVerified in Firebase:', err);
        // Don't fail the request — OTP was valid
      }
    }

    res.json({ message: 'OTP verified successfully.', verified: true });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};

// ========================================
// MAGIC LINK VERIFY (GET — from email link click)
// ========================================

export const verifyMagicLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, type } = req.query;

    if (!email || !code || !type) {
      res.redirect(`${FRONTEND_URL}/auth/verify?error=missing_params`);
      return;
    }

    const normalizedEmail = (email as string).toLowerCase().trim();
    const otpType = type as 'EMAIL_VERIFY' | 'PASSWORD_RESET';

    if (!['EMAIL_VERIFY', 'PASSWORD_RESET'].includes(otpType)) {
      res.redirect(`${FRONTEND_URL}/auth/verify?error=invalid_type`);
      return;
    }

    const result = await verifyOtp(normalizedEmail, code as string, otpType as 'EMAIL_VERIFY' | 'PASSWORD_RESET');

    if (!result.valid) {
      res.redirect(`${FRONTEND_URL}/auth/verify?error=invalid_code&type=${otpType}`);
      return;
    }

    if (otpType === 'EMAIL_VERIFY') {
      try {
        const firebaseUser = await admin.auth().getUserByEmail(normalizedEmail);
        await admin.auth().updateUser(firebaseUser.uid, { emailVerified: true });
      } catch (err) {
        console.error('Failed to set emailVerified in Firebase:', err);
      }
      res.redirect(`${FRONTEND_URL}/auth/verify?success=email_verified`);
    } else {
      // PASSWORD_RESET — redirect to reset page with verified token
      res.redirect(`${FRONTEND_URL}/auth/verify?success=otp_verified&email=${encodeURIComponent(normalizedEmail)}&code=${code}&type=PASSWORD_RESET`);
    }
  } catch (error) {
    console.error('Magic link verify error:', error);
    res.redirect(`${FRONTEND_URL}/auth/verify?error=server_error`);
  }
};

// ========================================
// RESET PASSWORD (after OTP verified)
// ========================================

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      res.status(400).json({ error: 'Email, code, and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify the OTP one more time (ensures code was valid)
    const otpResult = await verifyOtp(normalizedEmail, code, 'PASSWORD_RESET');

    if (!otpResult.valid) {
      res.status(400).json({ error: otpResult.error });
      return;
    }

    // Find the Firebase user
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(normalizedEmail);
    } catch {
      res.status(404).json({ error: 'No account found with this email.' });
      return;
    }

    // Update password in Firebase
    await admin.auth().updateUser(firebaseUser.uid, {
      password: newPassword,
    });

    // Send confirmation email
    await sendPasswordChangedEmail({
      email: normalizedEmail,
      name: firebaseUser.displayName || undefined,
    });

    res.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};

// ========================================
// RESET PASSWORD FOR PHONE USERS
// ========================================

export const sendPhoneResetOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, email } = req.body;

    if (!phone || !email) {
      res.status(400).json({ error: 'Phone number and email are required.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify the phone user exists by checking their fake email
    const phoneEmail = `${phone.replace(/[^0-9+]/g, '')}@tabeeb.phone`;
    
    try {
      await admin.auth().getUserByEmail(phoneEmail);
    } catch {
      // Don't reveal if user exists
      res.json({ message: 'If a phone account exists, a reset code has been sent to the provided email.' });
      return;
    }

    // Check if this phone user has this email in their doctor/patient profile
    const doctor = await prisma.doctor.findFirst({
      where: { phone: phone, email: normalizedEmail },
    });
    const patient = await prisma.patient.findFirst({
      where: { phone: phone, email: normalizedEmail },
    });

    if (!doctor && !patient) {
      // Don't reveal if match exists
      res.json({ message: 'If a phone account exists, a reset code has been sent to the provided email.' });
      return;
    }

    // Generate OTP
    const result = await generateOtp(phoneEmail, 'PASSWORD_RESET');

    if (result.error) {
      res.status(429).json({ error: result.error });
      return;
    }

    // Send OTP to the real email address
    const name = doctor?.name || `${patient?.firstName} ${patient?.lastName}`;
    await sendOtpEmail({
      email: normalizedEmail,
      code: result.code,
      type: 'PASSWORD_RESET',
      name,
      frontendUrl: FRONTEND_URL,
    });

    res.json({ message: 'If a phone account exists, a reset code has been sent to the provided email.' });
  } catch (error) {
    console.error('Phone reset OTP error:', error);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};

// ========================================
// RESET PASSWORD FOR PHONE USERS (after OTP)
// ========================================

export const resetPhonePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, code, newPassword, email } = req.body;

    if (!phone || !code || !newPassword) {
      res.status(400).json({ error: 'Phone, code, and new password are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const phoneEmail = `${phone.replace(/[^0-9+]/g, '')}@tabeeb.phone`;

    // Verify OTP (stored against the phone email)
    const otpResult = await verifyOtp(phoneEmail, code, 'PASSWORD_RESET');

    if (!otpResult.valid) {
      res.status(400).json({ error: otpResult.error });
      return;
    }

    // Find the Firebase user
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().getUserByEmail(phoneEmail);
    } catch {
      res.status(404).json({ error: 'No account found with this phone number.' });
      return;
    }

    // Update password in Firebase
    await admin.auth().updateUser(firebaseUser.uid, {
      password: newPassword,
    });

    // Send confirmation to the real email if provided
    if (email) {
      await sendPasswordChangedEmail({
        email: email.toLowerCase().trim(),
        name: firebaseUser.displayName || undefined,
      });
    }

    res.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Phone reset password error:', error);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};
