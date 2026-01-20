// src/controllers/verificationController.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { 
  deleteMultipleFromCloudinary,
  extractPublicIdFromUrl,
  verifyPublicIdOwnership,
  buildCloudinaryUrl
} from '../services/uploadService';

// Document can be either a string (legacy: just publicId) or an object with publicId and resourceType
type DocumentInfo = string | { publicId: string; resourceType: string };

interface VerificationDocuments {
  cnicFront: DocumentInfo;      // Cloudinary publicId or { publicId, resourceType }
  cnicBack?: DocumentInfo;      // Optional
  verificationPhoto: DocumentInfo;
  degreeCertificate: DocumentInfo;
  pmdcCertificate: DocumentInfo;
}

/**
 * Submit verification after client-side Cloudinary upload
 * POST /api/verification
 * Body: { pmdcNumber, cnicNumber, documents: { cnicFront, cnicBack?, verificationPhoto, degreeCertificate, pmdcCertificate }, ... }
 */
export const submitVerification = async (req: Request, res: Response) => {
  const doctorUid = req.user?.uid;
  const { 
    pmdcNumber, 
    pmdcRegistrationDate,
    cnicNumber,
    graduationYear,
    degreeInstitution,
    documents
  } = req.body as {
    pmdcNumber: string;
    pmdcRegistrationDate?: string;
    cnicNumber: string;
    graduationYear?: string;
    degreeInstitution?: string;
    documents: VerificationDocuments;
  };

  if (!doctorUid || !pmdcNumber) {
    return res.status(400).json({ error: 'Doctor UID and PMDC number are required' });
  }

  // Validate required documents
  if (!documents) {
    return res.status(400).json({ error: 'documents object is required' });
  }

  // Helper to extract publicId from document (handles both string and object formats)
  const getPublicId = (doc: DocumentInfo | undefined): string | undefined => {
    if (!doc) return undefined;
    return typeof doc === 'string' ? doc : doc.publicId;
  };

  const requiredDocs = ['cnicFront', 'verificationPhoto', 'degreeCertificate', 'pmdcCertificate'] as const;
  const missingDocs = requiredDocs.filter(doc => !getPublicId(documents[doc]));
  
  if (missingDocs.length > 0) {
    return res.status(400).json({ 
      error: `Missing required documents: ${missingDocs.join(', ')}` 
    });
  }

  // Verify all publicIds belong to this user
  const docTypes = ['cnicFront', 'cnicBack', 'verificationPhoto', 'degreeCertificate', 'pmdcCertificate'] as const;
  for (const docType of docTypes) {
    const publicId = getPublicId(documents[docType]);
    if (publicId && !verifyPublicIdOwnership(publicId, doctorUid, 'verification-doc')) {
      return res.status(403).json({ 
        error: `Invalid publicId for ${docType}. Document does not belong to this user.` 
      });
    }
  }

  try {
    // Validate doctor exists and verification status
    const doctor = await prisma.doctor.findUnique({ where: { uid: doctorUid } });
    
    if (!doctor) {
      return res.status(404).json({ 
        error: 'Doctor profile not found. Please create your doctor profile first.' 
      });
    }

    if (!doctor.isActive) {
      return res.status(403).json({ error: 'Doctor account is deactivated' });
    }

    // Check if verification already exists
    const existing = await prisma.verification.findUnique({ where: { doctorUid } });
    
    if (existing) {
      // Allow resubmission only if status is 'rejected'
      if (existing.status !== 'rejected') {
        return res.status(400).json({ error: 'Verification already submitted' });
      }
      
      // Delete old files from Cloudinary before accepting new ones
      const oldPublicIds: (string | null)[] = [
        existing.cnicFrontUrl ? extractPublicIdFromUrl(existing.cnicFrontUrl) : null,
        existing.cnicBackUrl ? extractPublicIdFromUrl(existing.cnicBackUrl) : null,
        existing.verificationPhotoUrl ? extractPublicIdFromUrl(existing.verificationPhotoUrl) : null,
        existing.degreeCertificateUrl ? extractPublicIdFromUrl(existing.degreeCertificateUrl) : null,
        existing.pmdcCertificateUrl ? extractPublicIdFromUrl(existing.pmdcCertificateUrl) : null
      ];
      
      const validOldPublicIds = oldPublicIds.filter((id): id is string => id !== null);
      
      if (validOldPublicIds.length > 0) {
        await deleteMultipleFromCloudinary(validOldPublicIds);
      }
    }

    // Build URLs from publicIds with correct resource types
    // Documents can be either string (legacy) or { publicId, resourceType } (new format)
    const getDocInfo = (doc: string | { publicId: string; resourceType: string }) => {
      if (typeof doc === 'string') {
        return { publicId: doc, resourceType: 'image' as const };
      }
      return { publicId: doc.publicId, resourceType: (doc.resourceType || 'image') as 'image' | 'video' | 'raw' };
    };
    
    const cnicFrontInfo = getDocInfo(documents.cnicFront);
    const cnicFrontUrl = buildCloudinaryUrl(cnicFrontInfo.publicId, cnicFrontInfo.resourceType);
    
    const cnicBackUrl = documents.cnicBack 
      ? buildCloudinaryUrl(getDocInfo(documents.cnicBack).publicId, getDocInfo(documents.cnicBack).resourceType) 
      : null;
    
    const verificationPhotoInfo = getDocInfo(documents.verificationPhoto);
    const verificationPhotoUrl = buildCloudinaryUrl(verificationPhotoInfo.publicId, verificationPhotoInfo.resourceType);
    
    const degreeCertificateInfo = getDocInfo(documents.degreeCertificate);
    const degreeCertificateUrl = buildCloudinaryUrl(degreeCertificateInfo.publicId, degreeCertificateInfo.resourceType);
    
    const pmdcCertificateInfo = getDocInfo(documents.pmdcCertificate);
    const pmdcCertificateUrl = buildCloudinaryUrl(pmdcCertificateInfo.publicId, pmdcCertificateInfo.resourceType);

    // Create or update verification record
    const verificationData = {
      doctorUid,
      pmdcNumber,
      pmdcRegistrationDate: pmdcRegistrationDate ? new Date(pmdcRegistrationDate) : null,
      cnicNumber,
      graduationYear,
      degreeInstitution,
      cnicFrontUrl,
      cnicBackUrl,
      verificationPhotoUrl,
      degreeCertificateUrl,
      pmdcCertificateUrl,
      status: 'pending',
      isVerified: false,
      adminComments: null,
      submittedAt: new Date()
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
          cnicBack: !!documents.cnicBack,
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
