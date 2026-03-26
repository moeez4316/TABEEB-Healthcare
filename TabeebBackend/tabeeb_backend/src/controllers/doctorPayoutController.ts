import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { invalidateAdminCaches, invalidateDoctorCaches } from '../services/cacheService';

const MAX_ACTIVE_PAYOUT_METHODS = 2;

type PayoutInput = {
  methodCode?: string;
  methodLabel?: string;
  accountTitle?: string;
  accountIdentifier?: string;
  bankName?: string;
  iban?: string;
  instructions?: string;
  isPrimary?: boolean;
};

const normalizeMethodCode = (value?: string): string =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

const sanitizeNullable = (value?: string): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const validateMethodCode = (methodCode: string): boolean => /^[A-Z0-9_]{2,50}$/.test(methodCode);

export const getOwnDoctorPayoutMethods = async (req: Request, res: Response) => {
  const doctorUid = req.user?.uid;

  if (!doctorUid) {
    return res.status(400).json({ error: 'User UID is required' });
  }

  try {
    const methods = await prisma.doctorPayoutMethod.findMany({
      where: {
        doctorUid,
        isActive: true,
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    return res.json({
      methods,
      maxActiveMethods: MAX_ACTIVE_PAYOUT_METHODS,
    });
  } catch (error) {
    console.error('Error fetching doctor payout methods:', error);
    return res.status(500).json({ error: 'Failed to fetch payout methods' });
  }
};

export const createDoctorPayoutMethod = async (req: Request, res: Response) => {
  const doctorUid = req.user?.uid;
  const body = (req.body || {}) as PayoutInput;

  if (!doctorUid) {
    return res.status(400).json({ error: 'User UID is required' });
  }

  const methodCode = normalizeMethodCode(body.methodCode);
  const methodLabel = sanitizeNullable(body.methodLabel);
  const accountIdentifier = sanitizeNullable(body.accountIdentifier);

  if (!methodCode || !validateMethodCode(methodCode)) {
    return res.status(400).json({
      error: 'methodCode is required and must contain only letters, numbers, or underscores',
    });
  }

  if (!accountIdentifier) {
    return res.status(400).json({ error: 'accountIdentifier is required' });
  }

  if (methodCode === 'OTHER' && !methodLabel) {
    return res.status(400).json({ error: 'methodLabel is required when methodCode is OTHER' });
  }

  try {
    const doctor = await prisma.doctor.findUnique({ where: { uid: doctorUid } });
    if (!doctor || !doctor.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const activeCount = await prisma.doctorPayoutMethod.count({
      where: { doctorUid, isActive: true }
    });

    if (activeCount >= MAX_ACTIVE_PAYOUT_METHODS) {
      return res.status(400).json({
        error: `You can only keep ${MAX_ACTIVE_PAYOUT_METHODS} payout methods at a time. Remove one before adding another.`
      });
    }

    const shouldSetPrimary = body.isPrimary === true || activeCount === 0;

    const createdMethod = await prisma.$transaction(async (tx) => {
      if (shouldSetPrimary) {
        await tx.doctorPayoutMethod.updateMany({
          where: { doctorUid, isActive: true },
          data: { isPrimary: false }
        });
      }

      return tx.doctorPayoutMethod.create({
        data: {
          doctorUid,
          methodCode,
          methodLabel,
          accountTitle: sanitizeNullable(body.accountTitle),
          accountIdentifier,
          bankName: sanitizeNullable(body.bankName),
          iban: sanitizeNullable(body.iban),
          instructions: sanitizeNullable(body.instructions),
          isPrimary: shouldSetPrimary,
          isActive: true,
        }
      });
    });

    await Promise.all([invalidateDoctorCaches(doctorUid), invalidateAdminCaches()]);

    return res.status(201).json({
      message: 'Payout method added successfully',
      method: createdMethod,
      maxActiveMethods: MAX_ACTIVE_PAYOUT_METHODS,
    });
  } catch (error) {
    console.error('Error creating doctor payout method:', error);
    return res.status(500).json({ error: 'Failed to add payout method' });
  }
};

export const updateDoctorPayoutMethod = async (req: Request, res: Response) => {
  const doctorUid = req.user?.uid;
  const { methodId } = req.params;
  const body = (req.body || {}) as PayoutInput;

  if (!doctorUid) {
    return res.status(400).json({ error: 'User UID is required' });
  }

  if (!methodId) {
    return res.status(400).json({ error: 'methodId is required' });
  }

  try {
    const existing = await prisma.doctorPayoutMethod.findFirst({
      where: {
        id: methodId,
        doctorUid,
        isActive: true,
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Payout method not found' });
    }

    const updateData: Record<string, unknown> = {};

    if (body.methodCode !== undefined) {
      const methodCode = normalizeMethodCode(body.methodCode);
      if (!methodCode || !validateMethodCode(methodCode)) {
        return res.status(400).json({
          error: 'methodCode must contain only letters, numbers, or underscores',
        });
      }
      updateData.methodCode = methodCode;

      const labelToCheck = body.methodLabel !== undefined
        ? sanitizeNullable(body.methodLabel)
        : existing.methodLabel;

      if (methodCode === 'OTHER' && !labelToCheck) {
        return res.status(400).json({ error: 'methodLabel is required when methodCode is OTHER' });
      }
    }

    if (body.methodLabel !== undefined) updateData.methodLabel = sanitizeNullable(body.methodLabel);
    if (body.accountTitle !== undefined) updateData.accountTitle = sanitizeNullable(body.accountTitle);
    if (body.bankName !== undefined) updateData.bankName = sanitizeNullable(body.bankName);
    if (body.iban !== undefined) updateData.iban = sanitizeNullable(body.iban);
    if (body.instructions !== undefined) updateData.instructions = sanitizeNullable(body.instructions);

    if (body.accountIdentifier !== undefined) {
      const accountIdentifier = sanitizeNullable(body.accountIdentifier);
      if (!accountIdentifier) {
        return res.status(400).json({ error: 'accountIdentifier cannot be empty' });
      }
      updateData.accountIdentifier = accountIdentifier;
    }

    const shouldSetPrimary = body.isPrimary === true;

    if (Object.keys(updateData).length === 0 && !shouldSetPrimary) {
      return res.status(400).json({ error: 'No valid fields provided to update' });
    }

    const updatedMethod = await prisma.$transaction(async (tx) => {
      if (shouldSetPrimary) {
        await tx.doctorPayoutMethod.updateMany({
          where: { doctorUid, isActive: true },
          data: { isPrimary: false }
        });
      }

      return tx.doctorPayoutMethod.update({
        where: { id: methodId },
        data: {
          ...updateData,
          ...(shouldSetPrimary ? { isPrimary: true } : {}),
        }
      });
    });

    await Promise.all([invalidateDoctorCaches(doctorUid), invalidateAdminCaches()]);

    return res.json({
      message: 'Payout method updated successfully',
      method: updatedMethod,
    });
  } catch (error) {
    console.error('Error updating doctor payout method:', error);
    return res.status(500).json({ error: 'Failed to update payout method' });
  }
};

export const deleteDoctorPayoutMethod = async (req: Request, res: Response) => {
  const doctorUid = req.user?.uid;
  const { methodId } = req.params;

  if (!doctorUid) {
    return res.status(400).json({ error: 'User UID is required' });
  }

  if (!methodId) {
    return res.status(400).json({ error: 'methodId is required' });
  }

  try {
    const existing = await prisma.doctorPayoutMethod.findFirst({
      where: {
        id: methodId,
        doctorUid,
        isActive: true,
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Payout method not found' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.doctorPayoutMethod.update({
        where: { id: methodId },
        data: {
          isActive: false,
          isPrimary: false,
        }
      });

      if (existing.isPrimary) {
        const replacement = await tx.doctorPayoutMethod.findFirst({
          where: {
            doctorUid,
            isActive: true,
            id: { not: methodId },
          },
          orderBy: { createdAt: 'asc' }
        });

        if (replacement) {
          await tx.doctorPayoutMethod.update({
            where: { id: replacement.id },
            data: { isPrimary: true }
          });
        }
      }
    });

    await Promise.all([invalidateDoctorCaches(doctorUid), invalidateAdminCaches()]);

    return res.json({
      message: 'Payout method removed successfully',
      maxActiveMethods: MAX_ACTIVE_PAYOUT_METHODS,
    });
  } catch (error) {
    console.error('Error deleting doctor payout method:', error);
    return res.status(500).json({ error: 'Failed to remove payout method' });
  }
};

export const getDoctorPayoutMethodsForAdmin = async (req: Request, res: Response) => {
  const { doctorUid } = req.params;
  const includeInactive = String(req.query.includeInactive || 'false').toLowerCase() === 'true';

  if (!doctorUid) {
    return res.status(400).json({ error: 'doctorUid is required' });
  }

  try {
    const doctor = await prisma.doctor.findUnique({
      where: { uid: doctorUid },
      select: {
        uid: true,
        firstName: true,
        lastName: true,
        name: true,
        email: true,
      }
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const methods = await prisma.doctorPayoutMethod.findMany({
      where: {
        doctorUid,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }]
    });

    return res.json({
      doctor,
      methods,
      maxActiveMethods: MAX_ACTIVE_PAYOUT_METHODS,
    });
  } catch (error) {
    console.error('Error fetching doctor payout methods for admin:', error);
    return res.status(500).json({ error: 'Failed to fetch doctor payout methods' });
  }
};