import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { buildCloudinaryUrl, verifyPublicIdOwnership } from '../services/uploadService';
import { invalidateAdminCaches, invalidatePatientCaches } from '../services/cacheService';

const MAX_FINANCIAL_AID_DOCUMENTS = 3;
const DEFAULT_DISCOUNT_PERCENT = 80;

type FinancialAidInputDocument = {
  publicId: string;
  resourceType?: string;
  url?: string;
  fileType?: string;
  fileName?: string;
  docType?: string;
};

const normalizeResourceType = (value?: string): 'image' | 'video' | 'raw' => {
  if (value === 'video' || value === 'raw' || value === 'image') {
    return value;
  }
  return 'image';
};

export const getMyFinancialAidRequest = async (req: Request, res: Response) => {
  const patientUid = req.user?.uid;

  if (!patientUid) {
    return res.status(400).json({ error: 'User UID is required' });
  }

  try {
    const request = await prisma.patientFinancialAidRequest.findUnique({
      where: { patientUid },
      include: {
        documents: {
          orderBy: { uploadedAt: 'asc' }
        }
      }
    });

    return res.json({
      request,
      maxDocuments: MAX_FINANCIAL_AID_DOCUMENTS,
      discountPercent: DEFAULT_DISCOUNT_PERCENT,
      isDiscountApproved: request?.status === 'APPROVED'
    });
  } catch (error) {
    console.error('Error fetching financial aid request:', error);
    return res.status(500).json({ error: 'Failed to fetch financial aid request' });
  }
};

export const submitFinancialAidRequest = async (req: Request, res: Response) => {
  const patientUid = req.user?.uid;
  const { documents, requestedDiscountPercent } = req.body as {
    documents?: FinancialAidInputDocument[];
    requestedDiscountPercent?: number;
  };

  if (!patientUid) {
    return res.status(400).json({ error: 'User UID is required' });
  }

  if (!Array.isArray(documents)) {
    return res.status(400).json({ error: 'documents must be an array' });
  }

  if (documents.length < 1 || documents.length > MAX_FINANCIAL_AID_DOCUMENTS) {
    return res.status(400).json({
      error: `Please upload between 1 and ${MAX_FINANCIAL_AID_DOCUMENTS} documents`
    });
  }

  const uniquePublicIds = new Set<string>();
  const normalizedDocuments: Array<{
    publicId: string;
    resourceType: 'image' | 'video' | 'raw';
    fileUrl: string;
    fileType: string | null;
    fileName: string | null;
    docType: string | null;
  }> = [];

  for (const [index, document] of documents.entries()) {
    const publicId = document?.publicId?.trim();

    if (!publicId) {
      return res.status(400).json({ error: `Document ${index + 1} is missing publicId` });
    }

    if (uniquePublicIds.has(publicId)) {
      return res.status(400).json({ error: 'Duplicate documents are not allowed' });
    }

    if (!verifyPublicIdOwnership(publicId, patientUid, 'financial-aid-doc')) {
      return res.status(403).json({
        error: `Invalid publicId for document ${index + 1}. Please upload again.`
      });
    }

    uniquePublicIds.add(publicId);

    const resourceType = normalizeResourceType(document?.resourceType);
    normalizedDocuments.push({
      publicId,
      resourceType,
      fileUrl: document?.url?.trim() || buildCloudinaryUrl(publicId, resourceType),
      fileType: document?.fileType?.trim() || null,
      fileName: document?.fileName?.trim() || null,
      docType: document?.docType?.trim() || null,
    });
  }

  try {
    const patient = await prisma.patient.findUnique({ where: { uid: patientUid } });
    if (!patient || !patient.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const existingRequest = await prisma.patientFinancialAidRequest.findUnique({
      where: { patientUid },
      select: { status: true }
    });

    if (existingRequest?.status === 'PENDING') {
      return res.status(409).json({
        error: 'Your financial aid request is already under admin review.'
      });
    }

    if (existingRequest?.status === 'APPROVED') {
      return res.status(409).json({
        error: 'Your financial aid request has already been approved.'
      });
    }

    const finalDiscount =
      typeof requestedDiscountPercent === 'number' && requestedDiscountPercent > 0
        ? Math.min(Math.round(requestedDiscountPercent), DEFAULT_DISCOUNT_PERCENT)
        : DEFAULT_DISCOUNT_PERCENT;

    const savedRequest = await prisma.$transaction(async (tx) => {
      const request = await tx.patientFinancialAidRequest.upsert({
        where: { patientUid },
        create: {
          patientUid,
          status: 'PENDING',
          requestedDiscountPercent: finalDiscount,
          submittedAt: new Date(),
        },
        update: {
          status: 'PENDING',
          requestedDiscountPercent: finalDiscount,
          adminComments: null,
          rejectionReason: null,
          submittedAt: new Date(),
          reviewedAt: null,
          reviewedBy: null,
        }
      });

      await tx.patientFinancialAidDocument.deleteMany({ where: { requestId: request.id } });

      await tx.patientFinancialAidDocument.createMany({
        data: normalizedDocuments.map((document) => ({
          requestId: request.id,
          docType: document.docType,
          fileUrl: document.fileUrl,
          publicId: document.publicId,
          resourceType: document.resourceType,
          fileType: document.fileType,
          fileName: document.fileName,
        }))
      });

      return tx.patientFinancialAidRequest.findUnique({
        where: { id: request.id },
        include: {
          documents: {
            orderBy: { uploadedAt: 'asc' }
          }
        }
      });
    });

    await Promise.all([invalidatePatientCaches(patientUid), invalidateAdminCaches()]);

    return res.status(201).json({
      message: 'Financial aid request submitted successfully and is pending admin review',
      request: savedRequest,
      maxDocuments: MAX_FINANCIAL_AID_DOCUMENTS,
      discountPercent: DEFAULT_DISCOUNT_PERCENT,
    });
  } catch (error) {
    console.error('Error submitting financial aid request:', error);
    return res.status(500).json({ error: 'Failed to submit financial aid request' });
  }
};

export const getFinancialAidRequestsForAdmin = async (req: Request, res: Response) => {
  const { status } = req.query as { status?: string };

  try {
    const normalizedStatus = status?.toUpperCase();
    const whereClause =
      normalizedStatus && ['PENDING', 'APPROVED', 'REJECTED'].includes(normalizedStatus)
        ? { status: normalizedStatus as 'PENDING' | 'APPROVED' | 'REJECTED' }
        : undefined;

    const requests = await prisma.patientFinancialAidRequest.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            uid: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        },
        documents: {
          orderBy: { uploadedAt: 'asc' }
        }
      },
      orderBy: [{ status: 'asc' }, { submittedAt: 'desc' }]
    });

    return res.json({
      requests,
      total: requests.length,
      filterStatus: normalizedStatus || 'ALL'
    });
  } catch (error) {
    console.error('Error fetching financial aid requests for admin:', error);
    return res.status(500).json({ error: 'Failed to fetch financial aid requests' });
  }
};

export const approveFinancialAidRequest = async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const { adminComments } = req.body as { adminComments?: string };
  const adminUsername = (req as any).admin?.username || 'admin';

  if (!requestId) {
    return res.status(400).json({ error: 'requestId is required' });
  }

  try {
    const updatedRequest = await prisma.patientFinancialAidRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: adminUsername,
        adminComments: adminComments?.trim() || 'Financial aid approved by admin',
        rejectionReason: null,
      },
      include: {
        patient: {
          select: {
            uid: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        documents: true,
      }
    });

    await Promise.all([
      invalidatePatientCaches(updatedRequest.patientUid),
      invalidateAdminCaches(),
    ]);

    return res.json({
      message: 'Financial aid request approved successfully',
      request: updatedRequest,
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ error: 'Financial aid request not found' });
    }

    console.error('Error approving financial aid request:', error);
    return res.status(500).json({ error: 'Failed to approve financial aid request' });
  }
};

export const rejectFinancialAidRequest = async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const { rejectionReason, adminComments } = req.body as {
    rejectionReason?: string;
    adminComments?: string;
  };
  const adminUsername = (req as any).admin?.username || 'admin';

  if (!requestId) {
    return res.status(400).json({ error: 'requestId is required' });
  }

  if (!rejectionReason || !rejectionReason.trim()) {
    return res.status(400).json({ error: 'rejectionReason is required' });
  }

  try {
    const updatedRequest = await prisma.patientFinancialAidRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: adminUsername,
        rejectionReason: rejectionReason.trim(),
        adminComments: adminComments?.trim() || null,
      },
      include: {
        patient: {
          select: {
            uid: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        documents: true,
      }
    });

    await Promise.all([
      invalidatePatientCaches(updatedRequest.patientUid),
      invalidateAdminCaches(),
    ]);

    return res.json({
      message: 'Financial aid request rejected successfully',
      request: updatedRequest,
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ error: 'Financial aid request not found' });
    }

    console.error('Error rejecting financial aid request:', error);
    return res.status(500).json({ error: 'Failed to reject financial aid request' });
  }
};