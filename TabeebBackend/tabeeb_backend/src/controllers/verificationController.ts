// src/controllers/verificationController.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// Submit verification (Doctor uploads CNIC, PMDC, Certificate)
export const submitVerification = async (req: Request, res: Response) => {
  const doctorUid = req.user?.uid;
  const { cnic, pmdcNumber, certificate } = req.body;

  if (!doctorUid || !cnic || !pmdcNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const existing = await prisma.verification.findUnique({ where: { doctorUid } });
    if (existing) {
      return res.status(400).json({ error: 'Verification already submitted' });
    }

    const verification = await prisma.verification.create({
      data: {
        doctorUid,
        cnic,
        pmdcNumber,
        certificate
      }
    });
    res.status(201).json(verification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit verification' });
  }
};

// Get verification status for doctor
export const getVerification = async (req: Request, res: Response) => {
  const doctorUid = req.user?.uid;

  try {
    const verification = await prisma.verification.findUnique({ where: { doctorUid } });
    if (!verification) return res.status(404).json({ error: 'Verification not found' });
    res.json(verification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch verification status' });
  }
};

// Approve verification (admin only)
export const approveVerification = async (req: Request, res: Response) => {
  const doctorUid = req.params.uid;

  try {
    const updated = await prisma.verification.update({
      where: { doctorUid },
      data: { isVerified: true }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve verification' });
  }
};
