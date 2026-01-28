import { Request, Response } from 'express';
import { 
  generateUploadSignature, 
  verifyPublicIdOwnership,
  buildCloudinaryUrl,
  UploadType 
} from '../services/uploadService';

/**
 * Generate signed upload parameters for client-side Cloudinary upload
 * POST /api/upload/signature
 */
export const getUploadSignature = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid || (req as any).admin?.username || 'admin';

    const { type, docType, mimeType } = req.body as { type: UploadType; docType?: string; mimeType?: string };

    if (!type) {
      return res.status(400).json({ error: 'Upload type is required' });
    }

    const validTypes: UploadType[] = ['profile-image', 'medical-record', 'verification-doc', 'chat-media', 'blog-image'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: `Invalid upload type. Must be one of: ${validTypes.join(', ')}` 
      });
    }

    // For verification docs, require docType
    if (type === 'verification-doc' && !docType) {
      return res.status(400).json({ 
        error: 'docType is required for verification documents',
        validDocTypes: ['cnic_front', 'cnic_back', 'verification_photo', 'degree_certificate', 'pmdc_certificate']
      });
    }

    const signature = generateUploadSignature({ type, userId, docType, mimeType });

    res.json({
      success: true,
      ...signature
    });

  } catch (error) {
    console.error('Error generating upload signature:', error);
    res.status(500).json({ error: 'Failed to generate upload signature' });
  }
};

/**
 * Verify that an upload was completed successfully
 * This endpoint validates that the publicId matches the user
 * POST /api/upload/verify
 */
export const verifyUpload = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid || (req as any).admin?.username || 'admin';

    const { publicId, type, resourceType } = req.body as { 
      publicId: string; 
      type: UploadType;
      resourceType?: 'image' | 'video' | 'raw';
    };

    if (!publicId || !type) {
      return res.status(400).json({ error: 'publicId and type are required' });
    }

    // Verify ownership
    const isOwner = verifyPublicIdOwnership(publicId, userId, type);
    if (!isOwner) {
      return res.status(403).json({ error: 'Public ID does not belong to this user' });
    }

    // Build the full URL
    const url = buildCloudinaryUrl(publicId, resourceType || 'image');

    res.json({
      success: true,
      verified: true,
      publicId,
      url
    });

  } catch (error) {
    console.error('Error verifying upload:', error);
    res.status(500).json({ error: 'Failed to verify upload' });
  }
};

/**
 * Get multiple signatures at once (useful for verification docs)
 * POST /api/upload/signatures/batch
 */
export const getBatchSignatures = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { uploads } = req.body as { 
      uploads: Array<{ type: UploadType; docType?: string; mimeType?: string }> 
    };

    if (!uploads || !Array.isArray(uploads) || uploads.length === 0) {
      return res.status(400).json({ error: 'uploads array is required' });
    }

    if (uploads.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 uploads per batch' });
    }

    const signatures = uploads.map(({ type, docType, mimeType }) => ({
      type,
      docType,
      ...generateUploadSignature({ type, userId, docType, mimeType })
    }));

    res.json({
      success: true,
      signatures
    });

  } catch (error) {
    console.error('Error generating batch signatures:', error);
    res.status(500).json({ error: 'Failed to generate batch signatures' });
  }
};
