import { DoctorProfile } from '@/store/slices/doctorSlice';

interface ProfileField {
  key: keyof DoctorProfile;
  weight: number;
  isObject?: boolean;
}

const DOCTOR_PROFILE_FIELDS: ProfileField[] = [
  // Essential Information (High Weight)
  { key: 'firstName', weight: 10 },
  { key: 'lastName', weight: 10 },
  { key: 'email', weight: 8 },
  { key: 'phone', weight: 8 },
  { key: 'cnic', weight: 6 },
  { key: 'dateOfBirth', weight: 6 },
  { key: 'gender', weight: 5 },
  
  // Medical Credentials (Very High Weight)
  { key: 'specialization', weight: 15 },
  { key: 'qualification', weight: 12 },
  { key: 'pmdcNumber', weight: 15 },
  { key: 'experience', weight: 10 },
  
  // Address Information (Medium Weight)
  { key: 'address', weight: 6, isObject: true },
  
  // Profile (Medium Weight)
  { key: 'profileImage', weight: 4 },
  
  // Preferences (Low Weight)
  { key: 'notifications', weight: 2, isObject: true },
];

// Helper function to check if a value is considered "filled"
const isFieldFilled = (value: any, isObject = false): boolean => {
  if (value === null || value === undefined || value === '') {
    return false;
  }
  
  if (isObject && typeof value === 'object') {
    // For nested objects like emergencyContact, clinicAddress, and notifications
    const keys = Object.keys(value);
    return keys.some(key => {
      const nestedValue = value[key];
      return nestedValue !== null && nestedValue !== undefined && nestedValue !== '';
    });
  }
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  return true;
};

// Calculate profile completion percentage
export const calculateDoctorProfileCompletion = (profile: DoctorProfile | null): {
  percentage: number;
  completedFields: number;
  totalFields: number;
  totalWeight: number;
  completedWeight: number;
  missingFields: string[];
} => {
  if (!profile) {
    return {
      percentage: 0,
      completedFields: 0,
      totalFields: DOCTOR_PROFILE_FIELDS.length,
      totalWeight: DOCTOR_PROFILE_FIELDS.reduce((sum, field) => sum + field.weight, 0),
      completedWeight: 0,
      missingFields: DOCTOR_PROFILE_FIELDS.map(field => field.key as string),
    };
  }

  let completedWeight = 0;
  let completedFields = 0;
  const missingFields: string[] = [];
  
  const totalWeight = DOCTOR_PROFILE_FIELDS.reduce((sum, field) => sum + field.weight, 0);

  DOCTOR_PROFILE_FIELDS.forEach(field => {
    const value = profile[field.key];
    const filled = isFieldFilled(value, field.isObject);
    
    if (filled) {
      completedWeight += field.weight;
      completedFields++;
    } else {
      missingFields.push(field.key as string);
    }
  });

  const percentage = Math.round((completedWeight / totalWeight) * 100);

  return {
    percentage,
    completedFields,
    totalFields: DOCTOR_PROFILE_FIELDS.length,
    totalWeight,
    completedWeight,
    missingFields,
  };
};

// Get completion status with descriptive text
export const getCompletionStatusColor = (percentage: number): {
  status: 'incomplete' | 'good' | 'excellent';
  message: string;
  color: string;
  bgColor: string;
} => {
  if (percentage < 50) {
    return {
      status: 'incomplete',
      message: 'Let\'s complete your profile!',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    };
  } else if (percentage < 80) {
    return {
      status: 'good',
      message: 'Great progress! Almost there.',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    };
  } else {
    return {
      status: 'excellent',
      message: 'Excellent! Your profile is complete.',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    };
  }
};

// Get next most important missing fields for suggestions
export const getNextSuggestions = (missingFields: string[], limit = 3): string[] => {
  const fieldWeights = DOCTOR_PROFILE_FIELDS.reduce((acc, field) => {
    acc[field.key as string] = field.weight;
    return acc;
  }, {} as Record<string, number>);

  return missingFields
    .sort((a, b) => (fieldWeights[b] || 0) - (fieldWeights[a] || 0))
    .slice(0, limit);
};

// Convert field key to display name
export const getFieldDisplayName = (fieldKey: string): string => {
  const displayNames: Record<string, string> = {
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email Address',
    phone: 'Phone Number',
    cnic: 'CNIC',
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    specialization: 'Medical Specialization',
    qualification: 'Medical Qualification',
    pmdcNumber: 'PMDC Registration Number',
    experience: 'Years of Experience',
    address: 'Address',
    profileImage: 'Profile Picture',
    notifications: 'Notification Preferences',
  };

  return displayNames[fieldKey] || fieldKey;
};

// Helper function to get completion status message
export function getCompletionStatusMessage(percentage: number): string {
  if (percentage >= 80) return 'Excellent! Your profile is complete.';
  if (percentage >= 50) return 'Great progress! Almost there.';
  return 'Let\'s complete your profile!';
}