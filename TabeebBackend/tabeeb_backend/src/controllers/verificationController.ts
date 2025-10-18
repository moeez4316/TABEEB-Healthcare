// src/controllers/verificationController.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { uploadVerificationDocument } from '../services/uploadService';

// Submit verification (Doctor uploads CNIC, PMDC, Certificate)
export const submitVerification = async (req: Request, res: Response) => {
  const doctorUid = req.user?.uid;
  const { 
    pmdcNumber, 
    pmdcRegistrationDate,
    cnicNumber,
    graduationYear,
    degreeInstitution
  } = req.body;
  const files = req.files as any;

  if (!doctorUid || !pmdcNumber) {
    return res.status(400).json({ error: 'Doctor UID and PMDC number are required' });
  }

  // Validate required documents
  const requiredDocs = ['cnicFront', 'verificationPhoto', 'degreeCertificate', 'pmdcCertificate'];
  const missingDocs = requiredDocs.filter(doc => !files?.[doc]);
  
  if (missingDocs.length > 0) {
    return res.status(400).json({ 
      error: `Missing required documents: ${missingDocs.join(', ')}` 
    });
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

    // Upload all documents to Cloudinary
    const uploadPromises = [];

    // Upload CNIC Front (required)
    uploadPromises.push(
      uploadVerificationDocument(files.cnicFront[0].buffer, doctorUid, 'cnic_front')
    );

    // Upload Verification Photo (required)
    uploadPromises.push(
      uploadVerificationDocument(files.verificationPhoto[0].buffer, doctorUid, 'verification_photo')
    );

    // Upload Degree Certificate (required)
    uploadPromises.push(
      uploadVerificationDocument(files.degreeCertificate[0].buffer, doctorUid, 'degree_certificate')
    );

    // Upload PMDC Certificate (required)
    uploadPromises.push(
      uploadVerificationDocument(files.pmdcCertificate[0].buffer, doctorUid, 'pmdc_certificate')
    );

    // Upload CNIC Back (optional)
    let cnicBackPromise = null;
    if (files?.cnicBack) {
      cnicBackPromise = uploadVerificationDocument(files.cnicBack[0].buffer, doctorUid, 'cnic_back');
      uploadPromises.push(cnicBackPromise);
    }

    const uploadResults = await Promise.all(uploadPromises);
    
    // Map results
    const [cnicFrontResult, verificationPhotoResult, degreeCertificateResult, pmdcCertificateResult, cnicBackResult] = uploadResults;

    // Create or update verification record
    const verificationData = {
      doctorUid,
      pmdcNumber,
      pmdcRegistrationDate: pmdcRegistrationDate ? new Date(pmdcRegistrationDate) : null,
      cnicNumber,
      graduationYear,
      degreeInstitution,
      cnicFrontUrl: (cnicFrontResult as any).secure_url,
      cnicBackUrl: files?.cnicBack ? (cnicBackResult as any).secure_url : null,
      verificationPhotoUrl: (verificationPhotoResult as any).secure_url,
      degreeCertificateUrl: (degreeCertificateResult as any).secure_url,
      pmdcCertificateUrl: (pmdcCertificateResult as any).secure_url,
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
        pmdcNumber: verification.pmdcNumber,
        documentsUploaded: {
          cnicFront: true,
          cnicBack: !!files?.cnicBack,
          verificationPhoto: true,
          degreeCertificate: true,
          pmdcCertificate: true
        }
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
      status: verification.status,
      pmdcNumber: verification.pmdcNumber,
      pmdcRegistrationDate: verification.pmdcRegistrationDate,
      cnicNumber: verification.cnicNumber,
      graduationYear: verification.graduationYear,
      degreeInstitution: verification.degreeInstitution,
      // Document URLs
      cnicFrontUrl: verification.cnicFrontUrl,
      cnicBackUrl: verification.cnicBackUrl,
      verificationPhotoUrl: verification.verificationPhotoUrl,
      degreeCertificateUrl: verification.degreeCertificateUrl,
      pmdcCertificateUrl: verification.pmdcCertificateUrl,
      // Legacy fields for backward compatibility
      cnicUrl: verification.cnicFrontUrl, // Map to front for compatibility
      certificateUrl: verification.pmdcCertificateUrl, // Map to PMDC for compatibility
      adminComments: verification.adminComments,
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
            uid: true,
            name: true,
            email: true,
            specialization: true,
            qualification: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc' // Most recent first
      }
    });
    
    // Process verifications to ensure doctor data is properly formatted
    const processedVerifications = verifications.map(verification => {
      const doctorData = verification.doctor;
      
      return {
        ...verification,
        doctor: doctorData ? {
          uid: doctorData.uid,
          name: doctorData.name || `${doctorData.firstName || ''} ${doctorData.lastName || ''}`.trim() || 'Unknown Doctor',
          email: doctorData.email || 'No email provided',
          specialization: doctorData.specialization,
          qualification: doctorData.qualification
        } : null
      };
    });
    
    res.json(processedVerifications);
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
