import { PatientProfile } from '@/store/slices/patientSlice';

interface ProfileField {
  key: keyof PatientProfile;
  weight: number;
  isArray?: boolean; 
}

const PROFILE_FIELDS: ProfileField[] = [
  // Essential Information (High Weight)
  { key: 'firstName', weight: 10 },
  { key: 'lastName', weight: 10 },
  { key: 'email', weight: 8 },
  { key: 'phone', weight: 8 },
  { key: 'dateOfBirth', weight: 8 },
  { key: 'gender', weight: 6 },
  
  // Medical Information (Medium-High Weight)
  { key: 'bloodType', weight: 6 },
  { key: 'height', weight: 5 },
  { key: 'weight', weight: 5 },
  { key: 'allergies', weight: 4, isArray: true },
  { key: 'medications', weight: 4, isArray: true },
  { key: 'medicalConditions', weight: 4, isArray: true },
  
  // Contact Information (Medium Weight)
  { key: 'emergencyContact', weight: 6 },
  { key: 'address', weight: 4 },
  
  // Additional Information (Lower Weight)
  { key: 'cnic', weight: 3 },
  { key: 'language', weight: 2 },
  { key: 'profileImage', weight: 3 },
];

// Helper function to check if a value is considered "filled"
const isFieldFilled = (value: any, isArray = false): boolean => {
  if (value === null || value === undefined || value === '') {
    return false;
  }
  
  if (isArray && Array.isArray(value)) {
    return value.length > 0;
  }
  
  if (typeof value === 'object') {
    // For nested objects like emergencyContact and address
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
export const calculateProfileCompletion = (profile: PatientProfile | null): {
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
      totalFields: PROFILE_FIELDS.length,
      totalWeight: PROFILE_FIELDS.reduce((sum, field) => sum + field.weight, 0),
      completedWeight: 0,
      missingFields: PROFILE_FIELDS.map(field => field.key as string),
    };
  }

  let completedWeight = 0;
  let completedFields = 0;
  const missingFields: string[] = [];
  
  const totalWeight = PROFILE_FIELDS.reduce((sum, field) => sum + field.weight, 0);

  PROFILE_FIELDS.forEach(field => {
    const value = profile[field.key];
    const filled = isFieldFilled(value, field.isArray);
    
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
    totalFields: PROFILE_FIELDS.length,
    totalWeight,
    completedWeight,
    missingFields,
  };
};

// Get completion status with descriptive text
export const getCompletionStatus = (percentage: number): {
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
  const fieldWeights = PROFILE_FIELDS.reduce((acc, field) => {
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
    dateOfBirth: 'Date of Birth',
    gender: 'Gender',
    bloodType: 'Blood Type',
    height: 'Height',
    weight: 'Weight',
    allergies: 'Allergies',
    medications: 'Current Medications',
    medicalConditions: 'Medical Conditions',
    emergencyContact: 'Emergency Contact',
    address: 'Address',
    cnic: 'CNIC',
    language: 'Preferred Language',
    profileImage: 'Profile Picture',
  };

  return displayNames[fieldKey] || fieldKey;
};