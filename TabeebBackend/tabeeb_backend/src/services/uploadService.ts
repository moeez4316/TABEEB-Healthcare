import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!
});

// ============================================
// SIGNED UPLOAD - Client-side upload support
// ============================================

export type UploadType = 'profile-image' | 'medical-record' | 'verification-doc' | 'chat-media';

interface UploadSignatureParams {
  type: UploadType;
  userId: string;
  docType?: string; // For verification docs: cnic_front, pmdc_certificate, etc.
  mimeType?: string; // File MIME type to determine resource_type for PDFs
}

interface SignatureResult {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  publicId: string;
  uploadUrl: string;
  resourceType: 'image' | 'video' | 'raw' | 'auto';
  eager?: string;
}

/**
 * Generate signed upload parameters for client-side Cloudinary upload
 * Security: Client can only upload to specific folder with specific public_id
 * Note: We include folder in publicId directly (no separate folder param) for simpler verification
 */
export const generateUploadSignature = ({ type, userId, docType, mimeType }: UploadSignatureParams): SignatureResult => {
  const timestamp = Math.round(Date.now() / 1000);
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  
  let folder: string;
  let publicId: string;
  let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
  let eager: string | undefined;
  
  // PublicId includes the full path (folder is embedded in publicId for easier verification)
  switch (type) {
    case 'profile-image':
      folder = 'tabeeb/profiles';
      publicId = `tabeeb/profiles/${userId}/avatar_${timestamp}`;
      resourceType = 'image';
      eager = 'c_fill,w_300,h_300,g_face/q_auto,f_auto';
      break;
      
    case 'medical-record':
      folder = 'tabeeb/medical-records';
      publicId = `tabeeb/medical-records/${userId}/${timestamp}`;
      // Use 'raw' for PDFs to ensure correct URL path, 'image' for images
      resourceType = mimeType === 'application/pdf' ? 'raw' : 'image';
      break;
      
    case 'verification-doc':
      folder = 'tabeeb/verification';
      publicId = `tabeeb/verification/${userId}/${docType || 'document'}_${timestamp}`;
      // Use 'raw' for PDFs to ensure correct URL path, 'image' for images
      resourceType = mimeType === 'application/pdf' ? 'raw' : 'image';
      break;
      
    case 'chat-media':
      folder = 'tabeeb/chat';
      publicId = `tabeeb/chat/${userId}/${timestamp}`;
      resourceType = 'auto'; // Could be image, audio, or file
      break;
      
    default:
      folder = 'tabeeb/uploads';
      publicId = `tabeeb/uploads/${userId}/${timestamp}`;
      resourceType = 'auto';
  }
  
  // Parameters to sign (must match what client sends)
  // Note: We don't include folder separately since it's part of publicId
  const paramsToSign: Record<string, string | number> = {
    timestamp,
    public_id: publicId,
  };
  
  // Add eager transformation for profile images
  if (eager) {
    paramsToSign.eager = eager;
  }
  
  // Generate signature
  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
  
  return {
    signature,
    timestamp,
    cloudName,
    apiKey,
    folder,
    publicId,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    resourceType,
    eager,
  };
};

/**
 * Build the full Cloudinary URL from publicId and resourceType
 */
export const buildCloudinaryUrl = (publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): string => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${publicId}`;
};

/**
 * Verify that a publicId belongs to the expected user and type
 * Security: Prevents users from claiming other users' uploads
 * Note: PublicId now includes full path (e.g., tabeeb/medical-records/userId/timestamp)
 */
export const verifyPublicIdOwnership = (publicId: string, userId: string, type: UploadType): boolean => {
  const expectedPrefixes: Record<UploadType, string> = {
    'profile-image': `tabeeb/profiles/${userId}/`,
    'medical-record': `tabeeb/medical-records/${userId}/`,
    'verification-doc': `tabeeb/verification/${userId}/`,
    'chat-media': `tabeeb/chat/${userId}/`,
  };
  
  return publicId.startsWith(expectedPrefixes[type]);
};

// ============================================
// LEGACY - Server-side upload (keeping for backward compatibility during migration)
// ============================================

export const uploadToCloudinary = (buffer: Buffer, filename: string, resourceType: 'image' | 'raw') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        public_id: filename,
        type: 'upload',
        access_mode: 'public',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// Enhanced upload for verification documents
export const uploadVerificationDocument = (
  buffer: Buffer, 
  doctorUid: string, 
  docType: 'cnic_front' | 'cnic_back' | 'verification_photo' | 'degree_certificate' | 'pmdc_certificate' | 'cnic' | 'certificate'
) => {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const filename = `verification/${doctorUid}/${docType}_${timestamp}`;
    
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto', // Auto-detect file type
        public_id: filename,
        folder: 'tabeeb/verification',
        type: 'upload',
        access_mode: 'public',
        tags: ['verification', docType, doctorUid]
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// Upload profile image for patients
export const uploadProfileImage = (buffer: Buffer, userId: string) => {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const filename = `profile/${userId}/avatar_${timestamp}`;
    
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        public_id: filename,
        folder: 'tabeeb/profiles',
        type: 'upload',
        access_mode: 'public',
        tags: ['profile', 'avatar', userId],
        transformation: [
          { width: 300, height: 300, crop: 'fill', gravity: 'face' },
          { quality: 'auto', format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary profile image upload error:', error);
          return reject(error);
        }
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// Cleanup utility - Delete files from Cloudinary
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error(`Failed to delete file from Cloudinary: ${publicId}`, error);
    // Don't throw - cleanup failures shouldn't block the error handling
  }
};

// Cleanup multiple files from Cloudinary
export const deleteMultipleFromCloudinary = async (publicIds: string[]): Promise<void> => {
  try {
    const deletePromises = publicIds.filter(id => id).map(id => deleteFromCloudinary(id));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Failed to cleanup multiple files from Cloudinary', error);
  }
};

// Extract public_id from Cloudinary URL
export const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/v{version}/{public_id}.{format}
    // OR: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{public_id}.{format}
    const urlParts = url.split('/upload/');
    if (urlParts.length < 2) return null;
    
    // Get the part after /upload/
    let publicIdPart = urlParts[1];
    
    // Remove version if present (e.g., v1234567890/)
    publicIdPart = publicIdPart.replace(/^v\d+\//, '');
    
    // Remove file extension
    const publicId = publicIdPart.substring(0, publicIdPart.lastIndexOf('.'));
    
    return publicId || null;
  } catch (error) {
    console.error('Error extracting public ID from URL:', url, error);
    return null;
  }
};