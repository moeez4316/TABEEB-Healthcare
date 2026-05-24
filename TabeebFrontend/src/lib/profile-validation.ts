// Validation utilities for profile forms

export interface ValidationErrors {
  [key: string]: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationErrors
}

// Typed interfaces describing only the fields each validator needs.
// Using interfaces instead of Record<string, unknown> means callers
// can pass their typed profile objects directly — no casts needed.
interface PatientProfileInput {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  cnic?: string
}

interface DoctorProfileInput extends PatientProfileInput {
  specialization?: string
}

// Validate email
function validateEmail(email: string): string | null {
  if (!email.trim()) {
    return 'Email is required'
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address'
  }
  
  return null
}

// Validate name fields
function validateName(name: string, fieldName: string, options: { isDoctor?: boolean } = {}): string | null {
  if (!name || !name.trim()) {
    return `${fieldName} is required`
  }
  
  const trimmedName = name.trim()
  
  // Check for common titles at the beginning (Dr., Mr., etc.)
  // If it's a doctor, we specifically want to prevent "Dr." to avoid "Dr. Dr. Name"
  if (options.isDoctor && /^(dr|prof)\.?\s+/i.test(trimmedName)) {
    return `${fieldName} should not include "Dr." or "Prof." title as it is added automatically`
  }
  
  if (trimmedName.length < 2) {
    return `${fieldName} must be at least 2 characters long`
  }
  
  // Allow letters, spaces, hyphens, and dots (for initials)
  // But reject if it contains numbers or other special characters
  if (!/^[a-zA-Z\s.-]+$/.test(trimmedName)) {
    return `${fieldName} can only contain letters, spaces, dots, and hyphens`
  }
  
  // Check if it's just dots and hyphens
  if (!/[a-zA-Z]/.test(trimmedName)) {
    return `${fieldName} must contain at least one letter`
  }

  return null
}

// Validate CNIC
function validateCNIC(cnic: string): string | null {
  if (!cnic.trim()) {
    return null // CNIC is optional
  }
  
  const cnicRegex = /^\d{5}-\d{7}-\d{1}$/
  if (!cnicRegex.test(cnic)) {
    return 'CNIC must be in format: 42401-1234567-8'
  }
  
  return null
}

// Validate phone number
function validatePhoneNumber(phone: string): string | null {
  if (!phone.trim()) {
    return 'Phone number is required'
  }
  
  const phoneRegex = /^\+92-\d{3}-\d{7}$/
  if (!phoneRegex.test(phone)) {
    return 'Phone number must be in format: +92-300-1234567'
  }
  
  return null
}

// Validate date of birth
function validateDateOfBirth(dateOfBirth: string): string | null {
  if (!dateOfBirth) {
    return 'Date of birth is required'
  }
  
  const birthDate = new Date(dateOfBirth)
  const today = new Date()
  const age = today.getFullYear() - birthDate.getFullYear()
  
  if (age < 0 || age > 150) {
    return 'Please enter a valid date of birth'
  }
  
  if (age < 13) {
    return 'You must be at least 13 years old'
  }
  
  return null
}

// Validate gender
function validateGender(gender: string): string | null {
  if (!gender) {
    return 'Gender is required'
  }
  
  const validGenders = ['male', 'female', 'other']
  if (!validGenders.includes(gender)) {
    return 'Please select a valid gender'
  }
  
  return null
}

// Main validation function for patient profile
export function validatePatientProfile(profile: PatientProfileInput): ValidationResult {
  const errors: ValidationErrors = {}
  
  // Validate required fields
  const firstNameError = validateName(profile.firstName ?? '', 'First name')
  if (firstNameError) errors.firstName = firstNameError
  
  const lastNameError = validateName(profile.lastName ?? '', 'Last name')
  if (lastNameError) errors.lastName = lastNameError
  
  if (profile.email) {
    const emailError = validateEmail(profile.email)
    if (emailError) errors.email = emailError
  }
  
  if (profile.phone) {
    const phoneError = validatePhoneNumber(profile.phone)
    if (phoneError) errors.phone = phoneError
  }
  
  if (profile.dateOfBirth) {
    const dateOfBirthError = validateDateOfBirth(profile.dateOfBirth)
    if (dateOfBirthError) errors.dateOfBirth = dateOfBirthError
  }
  
  if (profile.gender) {
    const genderError = validateGender(profile.gender)
    if (genderError) errors.gender = genderError
  }
  
  // Validate optional fields
  if (profile.cnic) {
    const cnicError = validateCNIC(profile.cnic)
    if (cnicError) errors.cnic = cnicError
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Main validation function for doctor profile
export function validateDoctorProfile(profile: DoctorProfileInput): ValidationResult {
  const errors: ValidationErrors = {}
  
  // Validate required fields
  const firstNameError = validateName(profile.firstName ?? '', 'First name', { isDoctor: true })
  if (firstNameError) errors.firstName = firstNameError
  
  const lastNameError = validateName(profile.lastName ?? '', 'Last name', { isDoctor: true })
  if (lastNameError) errors.lastName = lastNameError
  
  if (profile.email) {
    const emailError = validateEmail(profile.email)
    if (emailError) errors.email = emailError
  }
  
  if (profile.phone) {
    const phoneError = validatePhoneNumber(profile.phone)
    if (phoneError) errors.phone = phoneError
  }

  if (profile.specialization !== undefined && !profile.specialization.trim()) {
    errors.specialization = 'Specialization is required'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Helper function to get field error
export function getFieldError(errors: ValidationErrors, fieldName: string): string | null {
  return errors[fieldName] || null
}

// Helper function to check if there are any errors
export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0
}