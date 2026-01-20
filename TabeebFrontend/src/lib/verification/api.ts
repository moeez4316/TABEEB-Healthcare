import { uploadMultipleFiles, UploadProgress, validateFile } from '../cloudinary-upload';
import { handleRateLimit } from '../api-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface VerificationData {
  doctorUid: string;
  isVerified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  cnic: string;
  pmdcNumber: string;
  certificate?: string;
  adminComments?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  doctor?: {
    name: string;
    email: string;
  };
}

export interface SubmitVerificationRequest {
  pmdcNumber: string;
  pmdcRegistrationDate: string;
  cnicNumber: string;
  cnicFront: File | null;
  cnicBack: File | null;
  verificationPhoto: File | null;
  degreeCertificate: File | null;
  pmdcCertificate: File | null;
  graduationYear: string;
  degreeInstitution: string;
}

export interface SubmitVerificationOptions {
  onUploadProgress?: (docType: string, progress: UploadProgress) => void;
}

class VerificationAPI {
  private getAuthHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // Submit verification documents using client-side Cloudinary upload
  async submitVerification(
    data: SubmitVerificationRequest, 
    token: string,
    options?: SubmitVerificationOptions
  ): Promise<{ message: string; [key: string]: unknown }> {
    // Validate minimum requirements
    if (!data.pmdcNumber) {
      throw new Error('PMDC Number is required');
    }
    
    if (!data.cnicFront) {
      throw new Error('CNIC Front document is required');
    }

    // Validate all files
    const filesToValidate = [
      { file: data.cnicFront, name: 'CNIC Front' },
      { file: data.cnicBack, name: 'CNIC Back' },
      { file: data.verificationPhoto, name: 'Verification Photo' },
      { file: data.degreeCertificate, name: 'Degree Certificate' },
      { file: data.pmdcCertificate, name: 'PMDC Certificate' },
    ].filter(f => f.file !== null);

    for (const { file, name } of filesToValidate) {
      if (file) {
        const validation = validateFile(file, {
          maxSizeMB: 5,
          allowedTypes: ['image/*', 'application/pdf']
        });
        if (!validation.valid) {
          throw new Error(`${name}: ${validation.error}`);
        }
      }
    }

    // Prepare files for upload with their docTypes
    const filesToUpload: Array<{ file: File; type: 'verification-doc'; docType: string; name: string }> = [];
    
    const docTypeMap: Array<{ key: keyof SubmitVerificationRequest; docType: string; name: string }> = [
      { key: 'cnicFront', docType: 'cnic_front', name: 'CNIC Front' },
      { key: 'cnicBack', docType: 'cnic_back', name: 'CNIC Back' },
      { key: 'verificationPhoto', docType: 'verification_photo', name: 'Verification Photo' },
      { key: 'degreeCertificate', docType: 'degree_certificate', name: 'Degree Certificate' },
      { key: 'pmdcCertificate', docType: 'pmdc_certificate', name: 'PMDC Certificate' },
    ];

    for (const { key, docType, name } of docTypeMap) {
      const file = data[key];
      if (file instanceof File) {
        filesToUpload.push({ file, type: 'verification-doc', docType, name });
      }
    }

    // Upload all files to Cloudinary
    const uploadResults = await uploadMultipleFiles(
      filesToUpload,
      token,
      options?.onUploadProgress 
        ? (index, progress) => options.onUploadProgress!(filesToUpload[index].name, progress)
        : undefined
    );

    // Map upload results to document info (publicId + resourceType)
    const documents: Record<string, { publicId: string; resourceType: string }> = {};
    filesToUpload.forEach((fileData, index) => {
      documents[fileData.docType] = {
        publicId: uploadResults[index].publicId,
        resourceType: uploadResults[index].resourceType // 'image' or 'raw' from Cloudinary
      };
    });

    // Submit to backend with publicIds and resource types
    const response = await fetch(`${API_URL}/api/verification`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify({
        pmdcNumber: data.pmdcNumber,
        pmdcRegistrationDate: data.pmdcRegistrationDate || null,
        cnicNumber: data.cnicNumber,
        graduationYear: data.graduationYear,
        degreeInstitution: data.degreeInstitution,
        documents: {
          cnicFront: documents.cnic_front,
          cnicBack: documents.cnic_back || undefined,
          verificationPhoto: documents.verification_photo,
          degreeCertificate: documents.degree_certificate,
          pmdcCertificate: documents.pmdc_certificate,
        }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        const data = await response.json().catch(() => ({}));
        return handleRateLimit(data.retryAfter);
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit verification');
    }

    return response.json();
  }

  // Get verification status
  async getVerificationStatus(token: string): Promise<VerificationData> {
    const response = await fetch(`${API_URL}/api/verification`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        const data = await response.json().catch(() => ({}));
        return handleRateLimit(data.retryAfter);
      }
      if (response.status === 404) {
        throw new Error('NOT_FOUND');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch verification status');
    }

    return response.json();
  }

  // Poll verification status (for real-time updates)
  async pollVerificationStatus(
    token: string, 
    onStatusChange: (status: VerificationData) => void,
    interval: number = 30000 // 30 seconds
  ): Promise<() => void> {
    const poll = async () => {
      try {
        const status = await this.getVerificationStatus(token);
        onStatusChange(status);
      } catch {
        // Polling error
      }
    };

    const intervalId = setInterval(poll, interval);
    
    // Return cleanup function
    return () => clearInterval(intervalId);
  }
}

export const verificationAPI = new VerificationAPI();
