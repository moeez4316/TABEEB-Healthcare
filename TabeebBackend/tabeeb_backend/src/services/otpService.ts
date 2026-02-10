import crypto from 'crypto';
import prisma from '../lib/prisma';
import { OtpType } from '@prisma/client';

const OTP_EXPIRY_MINUTES = 10;
const OTP_RATE_LIMIT_SECONDS = 60; // Minimum seconds between OTP requests

// ========================================
// GENERATE OTP
// ========================================

export async function generateOtp(email: string, type: OtpType): Promise<{ code: string; error?: string }> {
  // Rate limit: check if an OTP was sent recently
  const recentOtp = await prisma.otpCode.findFirst({
    where: {
      email: email.toLowerCase(),
      type,
      createdAt: {
        gte: new Date(Date.now() - OTP_RATE_LIMIT_SECONDS * 1000),
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (recentOtp) {
    const waitSeconds = Math.ceil(
      (recentOtp.createdAt.getTime() + OTP_RATE_LIMIT_SECONDS * 1000 - Date.now()) / 1000
    );
    return { code: '', error: `Please wait ${waitSeconds} seconds before requesting another code.` };
  }

  // Invalidate any existing unused OTPs for this email + type
  await prisma.otpCode.updateMany({
    where: {
      email: email.toLowerCase(),
      type,
      used: false,
    },
    data: { used: true },
  });

  // Generate a 6-digit code
  const code = crypto.randomInt(100000, 999999).toString();

  // Store in DB
  await prisma.otpCode.create({
    data: {
      email: email.toLowerCase(),
      code,
      type,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    },
  });

  return { code };
}

// ========================================
// VERIFY OTP
// ========================================

export async function verifyOtp(
  email: string,
  code: string,
  type: OtpType
): Promise<{ valid: boolean; error?: string }> {
  const otp = await prisma.otpCode.findFirst({
    where: {
      email: email.toLowerCase(),
      code,
      type,
      used: false,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) {
    return { valid: false, error: 'Invalid or expired OTP code.' };
  }

  if (otp.expiresAt < new Date()) {
    // Mark expired OTP as used
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { used: true },
    });
    return { valid: false, error: 'OTP code has expired. Please request a new one.' };
  }

  // Mark OTP as used
  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { used: true },
  });

  return { valid: true };
}

// ========================================
// CLEANUP EXPIRED OTPs
// ========================================

export async function cleanupExpiredOtps(): Promise<number> {
  const result = await prisma.otpCode.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { used: true, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      ],
    },
  });
  return result.count;
}
