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

  // Validate PMDC Registration Date
  if (!data.pmdcRegistrationDate) {
    errors.push({
      field: 'pmdcRegistrationDate',
      message: 'PMDC registration date is required',
    });
  }

  // Validate CNIC Number
  if (!data.cnicNumber) {
    errors.push({
      field: 'cnicNumber',
      message: 'CNIC number is required',
    });
  } else if (!VALIDATION_RULES.CNIC_NUMBER.pattern.test(data.cnicNumber)) {
    errors.push({
      field: 'cnicNumber',
      message: VALIDATION_RULES.CNIC_NUMBER.message,
    });
  }

  // Validate CNIC Front
  if (!data.cnicFront) {
    errors.push({
      field: 'cnicFront',
      message: 'CNIC front image is required',
    });
  } else {
    const validation = validateFile(data.cnicFront, VALIDATION_RULES.CNIC_FRONT);
    if (!validation.isValid) {
      errors.push({
        field: 'cnicFront',
        message: validation.error || VALIDATION_RULES.CNIC_FRONT.message,
      });
    }
  }

  // Validate CNIC Back
  if (!data.cnicBack) {
    errors.push({
      field: 'cnicBack',
      message: 'CNIC back image is required',
    });
  } else {
    const validation = validateFile(data.cnicBack, VALIDATION_RULES.CNIC_BACK);
    if (!validation.isValid) {
      errors.push({
        field: 'cnicBack',
        message: validation.error || VALIDATION_RULES.CNIC_BACK.message,
      });
    }
  }

  // Validate Verification Photo
  if (!data.verificationPhoto) {
    errors.push({
      field: 'verificationPhoto',
      message: 'Verification photo is required',
    });
  } else {
    const validation = validateFile(data.verificationPhoto, VALIDATION_RULES.VERIFICATION_PHOTO);
    if (!validation.isValid) {
      errors.push({
        field: 'verificationPhoto',
        message: validation.error || VALIDATION_RULES.VERIFICATION_PHOTO.message,
      });
    }
  }

  // Validate Degree Certificate
  if (!data.degreeCertificate) {
    errors.push({
      field: 'degreeCertificate',
      message: 'Degree certificate is required',
    });
  } else {
    const validation = validateFile(data.degreeCertificate, VALIDATION_RULES.DEGREE_CERTIFICATE);
    if (!validation.isValid) {
      errors.push({
        field: 'degreeCertificate',
        message: validation.error || VALIDATION_RULES.DEGREE_CERTIFICATE.message,
      });
    }
  }

  // Validate PMDC Certificate
  if (!data.pmdcCertificate) {
    errors.push({
      field: 'pmdcCertificate',
      message: 'PMDC certificate is required',
    });
  } else {
    const validation = validateFile(data.pmdcCertificate, VALIDATION_RULES.PMDC_CERTIFICATE);
    if (!validation.isValid) {
      errors.push({
        field: 'pmdcCertificate',
        message: validation.error || VALIDATION_RULES.PMDC_CERTIFICATE.message,
      });
    }
  }

  // Validate Graduation Year
  if (!data.graduationYear) {
    errors.push({
      field: 'graduationYear',
      message: 'Graduation year is required',
    });
  } else {
    const year = parseInt(data.graduationYear);
    const currentYear = new Date().getFullYear();
    if (year < 1950 || year > currentYear) {
      errors.push({
        field: 'graduationYear',
        message: 'Please enter a valid graduation year',
      });
    }
  }

  // Validate Degree Institution
  if (!data.degreeInstitution) {
    errors.push({
      field: 'degreeInstitution',
      message: 'Degree institution is required',
    });
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
