// Validation utilities for profile forms

export interface ValidationErrors {
  [key: string]: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationErrors
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
function validateName(name: string, fieldName: string): string | null {
  if (!name.trim()) {
    return `${fieldName} is required`
  }
  
  if (name.trim().length < 2) {
    return `${fieldName} must be at least 2 characters long`
  }
  
  if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
    return `${fieldName} can only contain letters and spaces`
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
export function validateProfile(profile: Record<string, unknown>): ValidationResult {
  const errors: ValidationErrors = {}
  
  // Validate required fields
  const firstNameError = validateName(profile.firstName as string, 'First name')
  if (firstNameError) errors.firstName = firstNameError
  
  const lastNameError = validateName(profile.lastName as string, 'Last name')
  if (lastNameError) errors.lastName = lastNameError
  
  const emailError = validateEmail(profile.email as string)
  if (emailError) errors.email = emailError
  
  const phoneError = validatePhoneNumber(profile.phone as string)
  if (phoneError) errors.phone = phoneError
  
  const dateOfBirthError = validateDateOfBirth(profile.dateOfBirth as string)
  if (dateOfBirthError) errors.dateOfBirth = dateOfBirthError
  
  const genderError = validateGender(profile.gender as string)
  if (genderError) errors.gender = genderError
  
  // Validate optional fields
  const cnicError = validateCNIC(profile.cnic as string)
  if (cnicError) errors.cnic = cnicError
  
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