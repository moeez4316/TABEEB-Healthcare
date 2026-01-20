import { uploadFile, validateFile, UploadProgress } from './cloudinary-upload';
import { handleRateLimit } from './api-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface MedicalRecordUploadOptions {
  onProgress?: (progress: UploadProgress) => void;
}

/**
 * Upload a medical record using client-side Cloudinary upload
 * 
 * Flow:
 * 1. Validate file (size, type)
 * 2. Get signed upload params from backend
 * 3. Upload directly to Cloudinary
 * 4. Create record in backend with publicId
 */
export async function uploadMedicalRecord(
  file: File, 
  tags: string, 
  notes: string, 
  token: string,
  options?: MedicalRecordUploadOptions
) {
  // Validate file
  const validation = validateFile(file, {
    maxSizeMB: 5,
    allowedTypes: ['image/*', 'application/pdf']
  });
  
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Upload to Cloudinary
  const uploadResult = await uploadFile(file, 'medical-record', token, {
    onProgress: options?.onProgress
  });

  // Create record in backend
  const res = await fetch(`${API_URL}/api/records`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      publicId: uploadResult.publicId,
      resourceType: uploadResult.resourceType,
      fileName: file.name,
      fileType: file.type,
      tags,
      notes
    })
  });

  if (!res.ok) {
    if (res.status === 429) {
      const data = await res.json().catch(() => ({}));
      return handleRateLimit(data.retryAfter);
    }
    const error = await res.json();
    throw new Error(error.error || "Failed to save record");
  }
  
  return res.json();
}
