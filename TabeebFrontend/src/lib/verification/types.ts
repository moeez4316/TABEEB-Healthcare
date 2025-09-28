// lib/verification/types.ts

export type VerificationStatus = 'not-submitted' | 'pending' | 'approved' | 'rejected';

export interface VerificationFormData {
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
  CNIC_NUMBER: {
    required: true,
    pattern: /^\d{5}-\d{7}-\d{1}$/,
    message: 'CNIC must be in format: 42401-1234567-8',
  },
  CNIC_FRONT: {
    required: true,
    maxSize: 5 * 1024 * 1024, // 5MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
    message: 'CNIC front must be an image (JPG, PNG) under 5MB',
  },
  CNIC_BACK: {
    required: true,
    maxSize: 5 * 1024 * 1024, // 5MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
    message: 'CNIC back must be an image (JPG, PNG) under 5MB',
  },
  VERIFICATION_PHOTO: {
    required: true,
    maxSize: 5 * 1024 * 1024, // 5MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
    message: 'Verification photo must be an image (JPG, PNG) under 5MB',
  },
  DEGREE_CERTIFICATE: {
    required: true,
    maxSize: 10 * 1024 * 1024, // 10MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    message: 'Degree certificate must be an image (JPG, PNG) or PDF file under 10MB',
  },
  PMDC_CERTIFICATE: {
    required: true,
    maxSize: 10 * 1024 * 1024, // 10MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    message: 'PMDC certificate must be an image (JPG, PNG) or PDF file under 10MB',
  },
};
