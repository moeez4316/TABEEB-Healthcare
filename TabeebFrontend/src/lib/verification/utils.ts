// lib/verification/utils.ts
import { VerificationFormData, VerificationValidation, FileUploadError, VALIDATION_RULES } from './types';

export function validateVerificationForm(data: VerificationFormData): VerificationValidation {
  const errors: FileUploadError[] = [];

  // Validate PMDC Number
  if (!data.pmdcNumber) {
    errors.push({
      field: 'pmdcNumber',
      message: 'PMDC number is required',
    });
  } else if (!VALIDATION_RULES.PMDC_NUMBER.pattern.test(data.pmdcNumber)) {
    errors.push({
      field: 'pmdcNumber',
      message: VALIDATION_RULES.PMDC_NUMBER.message,
    });
  }

  // Validate CNIC file
  if (!data.cnic) {
    errors.push({
      field: 'cnic',
      message: 'CNIC document is required',
    });
  } else {
    const cnicValidation = validateFile(data.cnic, VALIDATION_RULES.CNIC);
    if (!cnicValidation.isValid) {
      errors.push({
        field: 'cnic',
        message: cnicValidation.error || VALIDATION_RULES.CNIC.message,
      });
    }
  }

  // Validate Certificate file (optional)
  if (data.certificate) {
    const certificateValidation = validateFile(data.certificate, VALIDATION_RULES.CERTIFICATE);
    if (!certificateValidation.isValid) {
      errors.push({
        field: 'certificate',
        message: certificateValidation.error || VALIDATION_RULES.CERTIFICATE.message,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateFile(file: File, rules: { maxSize: number; acceptedTypes: string[] }): { isValid: boolean; error?: string } {
  // Check file size
  if (file.size > rules.maxSize) {
    return {
      isValid: false,
      error: `File size must be less than ${formatFileSize(rules.maxSize)}`,
    };
  }

  // Check file type
  if (!rules.acceptedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not supported. Accepted types: ${rules.acceptedTypes.join(', ')}`,
    };
  }

  return { isValid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf';
}

// Format verification status for display
export function formatVerificationStatus(status: string): { text: string; color: string; bgColor: string } {
  switch (status) {
    case 'not-submitted':
      return {
        text: 'Not Submitted',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
      };
    case 'pending':
      return {
        text: 'Under Review',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
      };
    case 'approved':
      return {
        text: 'Verified',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
      };
    case 'rejected':
      return {
        text: 'Rejected',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
      };
    default:
      return {
        text: 'Unknown',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
      };
  }
}

// Calculate estimated review time
export function getEstimatedReviewTime(): string {
  return '24-48 hours';
}

// Format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
