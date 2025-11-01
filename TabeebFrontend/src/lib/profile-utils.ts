// Utility functions for profile data formatting and validation

// Format CNIC with dashes (42401-1234567-8)
export function formatCNIC(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '')
  
  // Add dashes at appropriate positions
  if (digits.length <= 5) {
    return digits
  } else if (digits.length <= 12) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  } else {
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`
  }
}

// Format phone number with Pakistani format (+92-300-1234567)
export function formatPhoneNumber(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '')
  
  // Handle Pakistani numbers
  if (digits.startsWith('92')) {
    const number = digits.slice(2) // Remove country code
    if (number.length <= 3) {
      return `+92-${number}`
    } else if (number.length <= 10) {
      return `+92-${number.slice(0, 3)}-${number.slice(3)}`
    } else {
      return `+92-${number.slice(0, 3)}-${number.slice(3, 10)}`
    }
  } else if (digits.startsWith('0')) {
    // Convert local format (0300) to international
    const number = digits.slice(1) // Remove leading 0
    if (number.length <= 3) {
      return `+92-${number}`
    } else if (number.length <= 10) {
      return `+92-${number.slice(0, 3)}-${number.slice(3)}`
    } else {
      return `+92-${number.slice(0, 3)}-${number.slice(3, 10)}`
    }
  } else {
    // Assume it's a local number without country code
    if (digits.length <= 3) {
      return `+92-${digits}`
    } else if (digits.length <= 10) {
      return `+92-${digits.slice(0, 3)}-${digits.slice(3)}`
    } else {
      return `+92-${digits.slice(0, 3)}-${digits.slice(3, 10)}`
    }
  }
}

// Pakistani provinces
export const pakistaniProvinces = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Gilgit-Baltistan',
  'Azad Jammu and Kashmir'
]

// Blood group options
export const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

// Pakistani languages
export const pakistaniLanguages = [
  'English',
  'Urdu',
  'Punjabi',
  'Sindhi',
  'Pashto',
  'Balochi',
  'Saraiki',
  'Hindko',
  'Brahui'
]

// Pakistani medical specializations
export const pakistaniMedicalSpecializations = [
  'General Practice',
  'Internal Medicine',
  'Cardiology',
  'Dermatology',
  'Emergency Medicine',
  'Endocrinology',
  'Gastroenterology',
  'Neurology',
  'Oncology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Radiology',
  'Surgery',
  'Gynecology & Obstetrics',
  'Ophthalmology',
  'ENT (Otolaryngology)',
  'Anesthesiology',
  'Pathology',
  'Urology',
  'Plastic Surgery',
  'Nephrology',
  'Pulmonology',
  'Rheumatology',
  'Hematology',
  'Infectious Diseases',
  'Physical Medicine & Rehabilitation',
  'Family Medicine',
  'Other'
]

// Medical qualifications common in Pakistan
export const pakistaniMedicalQualifications = [
  'MBBS',
  'BDS',
  'MBBS, FCPS',
  'MBBS, MD',
  'MBBS, MS',
  'MBBS, MRCP',
  'MBBS, FRCS',
  'MBBS, MCPS',
  'MBBS, Diploma',
  'BDS, FCPS',
  'BDS, MDS',
  'BAMS',
  'BHMS',
  'Pharm.D',
  'Other'
]

// Calculate BMI
export function calculateBMI(heightCm: string, weightKg: string): number | null {
  const height = parseFloat(heightCm)
  const weight = parseFloat(weightKg)
  
  if (!height || !weight || height <= 0 || weight <= 0) {
    return null
  }
  
  const heightM = height / 100 // Convert cm to meters
  return parseFloat((weight / (heightM * heightM)).toFixed(1))
}

// Get BMI status
export function getBMIStatus(bmi: number | null): string {
  if (!bmi) return 'Unknown'
  
  if (bmi < 18.5) return 'Underweight'
  if (bmi < 25) return 'Normal'
  if (bmi < 30) return 'Overweight'
  return 'Obese'
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate CNIC
export function isValidCNIC(cnic: string): boolean {
  const cnicRegex = /^\d{5}-\d{7}-\d{1}$/
  return cnicRegex.test(cnic)
}

// Validate Pakistani phone number (flexible format)
export function isValidPhoneNumber(phone: string): boolean {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Check for Pakistani number formats:
  // +923001234567 (13 digits with +92)
  // 923001234567 (12 digits starting with 92)
  // 03001234567 (11 digits starting with 0)
  
  if (cleaned.startsWith('+92')) {
    // +92 followed by 10 digits
    return /^\+92\d{10}$/.test(cleaned);
  } else if (cleaned.startsWith('92')) {
    // 92 followed by 10 digits
    return /^92\d{10}$/.test(cleaned);
  } else if (cleaned.startsWith('0')) {
    // 0 followed by 10 digits
    return /^0\d{10}$/.test(cleaned);
  }
  
  return false;
}