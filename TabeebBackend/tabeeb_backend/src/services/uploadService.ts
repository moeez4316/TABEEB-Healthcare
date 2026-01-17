import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!
});

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

// Upload blog images
export const uploadBlogImage = (buffer: Buffer, userId: string, folder: string) => {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const filename = `${folder}/${userId}/image_${timestamp}`;
    
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        public_id: filename,
        folder: 'tabeeb/blogs',
        type: 'upload',
        access_mode: 'public',
        tags: ['blog', folder, userId],
        transformation: [
          { quality: 'auto', format: 'auto', width: 1200, crop: 'limit' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary blog image upload error:', error);
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