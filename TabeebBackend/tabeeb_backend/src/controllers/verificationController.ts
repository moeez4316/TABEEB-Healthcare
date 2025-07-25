// src/controllers/verificationController.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { uploadVerificationDocument } from '../services/uploadService';

// Submit verification (Doctor uploads CNIC, PMDC, Certificate)
export const submitVerification = async (req: Request, res: Response) => {
  const doctorUid = req.user?.uid;
  const { pmdcNumber } = req.body;
  const files = req.files as any;

  if (!doctorUid || !pmdcNumber) {
    return res.status(400).json({ error: 'Doctor UID and PMDC number are required' });
  }

  if (!files?.cnic) {
    return res.status(400).json({ error: 'CNIC document is required' });
  }

  try {
    // Check if doctor exists
    const doctor = await prisma.doctor.findUnique({ where: { uid: doctorUid } });
    
    if (!doctor) {
      return res.status(404).json({ 
        error: 'Doctor profile not found. Please create your doctor profile first.' 
      });
    }

    // Check if verification already exists
    const existing = await prisma.verification.findUnique({ where: { doctorUid } });
    
    if (existing) {
      // Allow resubmission only if status is 'rejected'
      if (existing.status !== 'rejected') {
        return res.status(400).json({ error: 'Verification already submitted' });
      }
      // If rejected, we'll update the existing record instead of creating new one
    }

    // Upload CNIC to Cloudinary
    const cnicResult = await uploadVerificationDocument(
      files.cnic[0].buffer, 
      doctorUid, 
      'cnic'
    ) as any;

    let certificateUrl = null;
    if (files?.certificate) {
      const certificateResult = await uploadVerificationDocument(
        files.certificate[0].buffer,
        doctorUid,
        'certificate'
      ) as any;
      certificateUrl = certificateResult.secure_url;
    }

    // Create or update verification record
    const verificationData = {
      doctorUid,
      pmdcNumber,
      cnic: cnicResult.secure_url,
      certificate: certificateUrl,
      status: 'pending', // Reset status to pending for resubmissions
      isVerified: false, // Reset verification status
      adminComments: null, // Clear previous admin comments
      submittedAt: new Date() // Update submission date
    };

    const verification = existing && existing.status === 'rejected' 
      ? await prisma.verification.update({
          where: { doctorUid },
          data: verificationData
        })
      : await prisma.verification.create({
          data: verificationData
        });
    
    res.status(201).json({
      message: existing && existing.status === 'rejected' 
        ? 'Verification resubmitted successfully' 
        : 'Verification submitted successfully',
      verification: {
        id: verification.doctorUid,
        pmdcNumber: verification.pmdcNumber
      }
    });

  } catch (error) {
    console.error('Error in submitVerification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to submit verification', details: errorMessage });
  }
};

// Get verification status for doctor
export const getVerification = async (req: Request, res: Response) => {
  const doctorUid = req.user?.uid;

  try {
    const verification = await prisma.verification.findUnique({ 
      where: { doctorUid },
      include: { doctor: { select: { name: true, email: true } } }
    });
    
    if (!verification) {
      return res.status(404).json({ error: 'Verification not found' });
    }
    
    const response = {
      id: verification.doctorUid,
      isVerified: verification.isVerified,
      status: verification.status, // Add status field
      pmdcNumber: verification.pmdcNumber,
      cnicUrl: verification.cnic,
      certificateUrl: verification.certificate,
      adminComments: verification.adminComments, // Add admin comments
      submittedAt: verification.submittedAt,
      reviewedAt: verification.reviewedAt,
      doctor: verification.doctor
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error in getVerification:', error);
    res.status(500).json({ error: 'Failed to fetch verification status' });
  }
};

// Get all verifications (Admin only)
export const getAllVerifications = async (req: Request, res: Response) => {
  try {
    
    const verifications = await prisma.verification.findMany({
      include: {
        doctor: {
          select: {
            name: true,
            email: true,
            specialization: true,
            qualification: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc' // Most recent first
      }
    });
    
    console.log('📊 Found verifications:', verifications.length);
    
    res.json(verifications);
  } catch (error) {
    console.error('Error in getAllVerifications:', error);
    res.status(500).json({ error: 'Failed to fetch verifications' });
  }
};// Approve verification (admin only)
export const approveVerification = async (req: Request, res: Response) => {
  const doctorUid = req.params.uid;
  const { adminComments } = req.body;
  const adminUsername = (req as any).admin?.username || 'admin';

  try {
    const verification = await prisma.verification.update({
      where: { doctorUid },
      data: {
        isVerified: true,
        status: 'approved',
        adminComments: adminComments || 'Verification approved by admin',
        reviewedAt: new Date(),
        reviewedBy: adminUsername
      }
    });

    res.json({ 
      message: 'Doctor verified successfully', 
      verification 
    });
  } catch (error) {
    console.error('Error in approveVerification:', error);
    res.status(500).json({ error: 'Failed to approve verification' });
  }
};

// Reject verification (admin only)
export const rejectVerification = async (req: Request, res: Response) => {
  const doctorUid = req.params.uid;
  const { adminComments } = req.body;
  const adminUsername = (req as any).admin?.username || 'admin';

  try {
    const verification = await prisma.verification.update({
      where: { doctorUid },
      data: {
        isVerified: false,
        status: 'rejected',
        adminComments: adminComments || 'Verification rejected by admin',
        reviewedAt: new Date(),
        reviewedBy: adminUsername
      }
    });

    res.json({ 
      message: 'Verification rejected', 
      verification 
    });
  } catch (error) {
    console.error('Error in rejectVerification:', error);
    res.status(500).json({ error: 'Failed to reject verification' });
  }
};
