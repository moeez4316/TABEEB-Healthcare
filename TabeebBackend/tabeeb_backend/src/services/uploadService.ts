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
export const uploadVerificationDocument = (buffer: Buffer, doctorUid: string, docType: 'cnic' | 'certificate') => {
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
        console.log('✅ Document uploaded successfully:', result?.secure_url);
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
        console.log('✅ Profile image uploaded successfully:', result?.secure_url);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};