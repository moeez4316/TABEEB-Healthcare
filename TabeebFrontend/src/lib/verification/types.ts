// lib/verification/types.ts

export type VerificationStatus = 'not-submitted' | 'pending' | 'approved' | 'rejected';

export interface VerificationFormData {
  pmdcNumber: string;
  cnic: File | null;
  certificate?: File | null;
}

export interface VerificationStatusData {
  doctorUid: string;
  isVerified: boolean;
  status: VerificationStatus;
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

export interface FileUploadError {
  field: string;
  message: string;
}

export interface VerificationValidation {
  isValid: boolean;
  errors: FileUploadError[];
}

// File validation constraints
export const VALIDATION_RULES = {
  PMDC_NUMBER: {
    required: true,
    pattern: /^\d{6}-P$/i,
    message: 'PMDC number must be in format: 6 digits followed by -P (e.g., 100327-P)',
  },
  CNIC: {
    required: true,
    maxSize: 5 * 1024 * 1024, // 5MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    message: 'CNIC must be an image (JPG, PNG) or PDF file under 5MB',
  },
  CERTIFICATE: {
    required: false,
    maxSize: 10 * 1024 * 1024, // 10MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    message: 'Certificate must be an image (JPG, PNG) or PDF file under 10MB',
  },
};
