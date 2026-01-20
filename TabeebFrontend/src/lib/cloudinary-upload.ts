/**
 * Cloudinary Client-Side Upload Service
 * 
 * This service handles secure client-side uploads to Cloudinary.
 * 1. Get signed upload parameters from backend
 * 2. Upload directly to Cloudinary (bypasses backend for file transfer)
 * 3. Return publicId and URL to use with backend APIs
 */

import { handleRateLimit } from './api-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type UploadType = 'profile-image' | 'medical-record' | 'verification-doc' | 'chat-media';

export interface UploadSignature {
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

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  resourceType: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Get signed upload parameters from backend
 */
export async function getUploadSignature(
  type: UploadType,
  token: string,
  docType?: string,
  mimeType?: string
): Promise<UploadSignature> {
  const response = await fetch(`${API_URL}/api/upload/signature`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ type, docType, mimeType })
  });

  if (!response.ok) {
    if (response.status === 429) {
      const data = await response.json().catch(() => ({}));
      return handleRateLimit(data.retryAfter);
    }
    const error = await response.json();
    throw new Error(error.error || 'Failed to get upload signature');
  }

  return response.json();
}

/**
 * Get multiple signatures at once (useful for verification docs)
 */
export async function getBatchSignatures(
  uploads: Array<{ type: UploadType; docType?: string; mimeType?: string }>,
  token: string
): Promise<UploadSignature[]> {
  const response = await fetch(`${API_URL}/api/upload/signatures/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ uploads })
  });

  if (!response.ok) {
    if (response.status === 429) {
      const data = await response.json().catch(() => ({}));
      return handleRateLimit(data.retryAfter);
    }
    const error = await response.json();
    throw new Error(error.error || 'Failed to get batch signatures');
  }

  const data = await response.json();
  return data.signatures;
}

/**
 * Upload file directly to Cloudinary with progress tracking
 * Note: folder is embedded in publicId (e.g., tabeeb/medical-records/userId/timestamp)
 * so we don't send folder separately
 */
export function uploadToCloudinary(
  file: File | Blob,
  signature: UploadSignature,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', signature.timestamp.toString());
    formData.append('signature', signature.signature);
    // Note: folder is part of publicId, so we don't send it separately
    formData.append('public_id', signature.publicId);
    
    if (signature.eager) {
      formData.append('eager', signature.eager);
    }

    const xhr = new XMLHttpRequest();

    // Progress tracking
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100)
        });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            publicId: response.public_id,
            url: response.url,
            secureUrl: response.secure_url,
            resourceType: response.resource_type,
            format: response.format,
            bytes: response.bytes,
            width: response.width,
            height: response.height,
            duration: response.duration
          });
        } catch {
          reject(new Error('Failed to parse upload response'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error?.message || 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was aborted'));
    });

    xhr.open('POST', signature.uploadUrl);
    xhr.send(formData);
  });
}

/**
 * High-level upload function that handles the full flow
 */
export async function uploadFile(
  file: File | Blob,
  type: UploadType,
  token: string,
  options?: {
    docType?: string;
    onProgress?: (progress: UploadProgress) => void;
  }
): Promise<UploadResult> {
  // Step 1: Get signature from backend
  const signature = await getUploadSignature(type, token, options?.docType);
  
  // Step 2: Upload to Cloudinary
  const result = await uploadToCloudinary(file, signature, options?.onProgress);
  
  return result;
}

/**
 * Upload multiple files in parallel (useful for verification docs)
 */
export async function uploadMultipleFiles(
  files: Array<{ file: File | Blob; type: UploadType; docType?: string }>,
  token: string,
  onProgress?: (index: number, progress: UploadProgress) => void
): Promise<UploadResult[]> {
  // Get all signatures at once - include mimeType for each file
  const signatures = await getBatchSignatures(
    files.map(f => ({ 
      type: f.type, 
      docType: f.docType, 
      mimeType: f.file instanceof File ? f.file.type : undefined 
    })),
    token
  );

  // Upload all files in parallel
  const uploadPromises = files.map((fileData, index) =>
    uploadToCloudinary(
      fileData.file,
      signatures[index],
      onProgress ? (progress) => onProgress(index, progress) : undefined
    )
  );

  return Promise.all(uploadPromises);
}

/**
 * Determine file type for Cloudinary resource_type
 */
export function getResourceType(file: File): 'image' | 'video' | 'raw' {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/') || file.type.startsWith('audio/')) return 'video';
  return 'raw';
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options?: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  }
): { valid: boolean; error?: string } {
  const maxSize = (options?.maxSizeMB || 5) * 1024 * 1024;
  
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File size exceeds ${options?.maxSizeMB || 5}MB limit` 
    };
  }

  if (options?.allowedTypes && options.allowedTypes.length > 0) {
    const isAllowed = options.allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', '/'));
      }
      return file.type === type;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`
      };
    }
  }

  return { valid: true };
}
