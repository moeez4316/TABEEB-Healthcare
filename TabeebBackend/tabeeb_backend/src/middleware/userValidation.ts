import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebase';

/**
 * Validates that a string is a proper name (no numbers, min length 2)
 */
const isValidName = (name: string): boolean => {
  if (!name || name.trim().length < 2) return false;
  // Regex to allow letters, spaces, hyphens, and dots (standard for names)
  // But strictly NO numbers
  const nameRegex = /^[a-zA-Z\s\.\-]+$/;
  if (!nameRegex.test(name)) return false;
  
  // Must contain at least one letter
  return /[a-zA-Z]/.test(name);
};

/**
 * Checks if a string starts with common titles (Dr., Prof.)
 */
const containsDoctorTitle = (name: string): boolean => {
  if (!name) return false;
  return /^(dr|prof)\.?\s+/i.test(name.trim());
};

/**
 * Validates email format
 */
const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Middleware to check if the Firebase user's email is verified
 */
export const verifyEmailVerified = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication token required' });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    if (!decoded.email_verified) {
      return res.status(403).json({ 
        error: 'Email verification required',
        code: 'EMAIL_NOT_VERIFIED',
        email: decoded.email 
      });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware to validate patient profile data (signup and update)
 */
export const validatePatientProfile = (req: Request, res: Response, next: NextFunction) => {
  const { firstName, lastName, email, dateOfBirth, gender, bloodType, cnic, allergies, medications, medicalConditions } = req.body;

  const errors: string[] = [];

  if (firstName !== undefined && !isValidName(firstName)) {
    errors.push('First name must be at least 2 characters and contain no numbers');
  }

  if (lastName !== undefined && !isValidName(lastName)) {
    errors.push('Last name must be at least 2 characters and contain no numbers');
  }

  if (email !== undefined && !isValidEmail(email)) {
    errors.push('A valid email address is required');
  }

  if (dateOfBirth !== undefined) {
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      errors.push('Invalid date of birth format');
    } else if (dob > new Date()) {
      errors.push('Date of birth cannot be in the future');
    }
  }

  if (gender !== undefined) {
    const validGenders = ['male', 'female', 'other'];
    if (!validGenders.includes(gender.toLowerCase())) {
      errors.push('Invalid gender selected');
    }
  }

  if (bloodType !== undefined && bloodType !== null && bloodType.trim() !== '') {
    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodTypes.includes(bloodType)) {
      errors.push('Invalid blood type');
    }
  }

  if (cnic !== undefined && cnic !== null && cnic.trim() !== '') {
    if (cnic.length > 20) {
      errors.push('CNIC is too long');
    }
  }

  // Prevent massive payloads in arrays
  if (allergies && typeof allergies === 'string' && allergies.length > 2000) errors.push('Allergies list is too long');
  if (medications && typeof medications === 'string' && medications.length > 2000) errors.push('Medications list is too long');
  if (medicalConditions && typeof medicalConditions === 'string' && medicalConditions.length > 2000) errors.push('Medical conditions list is too long');

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join('. ') });
  }

  next();
};

/**
 * Middleware to validate doctor profile data (signup and update)
 */
export const validateDoctorProfile = (req: Request, res: Response, next: NextFunction) => {
  const { firstName, lastName, email, specialization, qualification, dateOfBirth, gender } = req.body;

  const errors: string[] = [];

  if (firstName !== undefined) {
    if (!isValidName(firstName)) {
      errors.push('First name must be at least 2 characters and contain no numbers');
    } else if (containsDoctorTitle(firstName)) {
      errors.push('First name should not include "Dr." or "Prof." title as it is added automatically');
    }
  }

  if (lastName !== undefined) {
    if (!isValidName(lastName)) {
      errors.push('Last name must be at least 2 characters and contain no numbers');
    } else if (containsDoctorTitle(lastName)) {
      errors.push('Last name should not include "Dr." or "Prof." title as it is added automatically');
    }
  }

  if (email !== undefined && !isValidEmail(email)) {
    errors.push('A valid email address is required');
  }

  if (specialization !== undefined && (!specialization || specialization.trim().length < 3)) {
    errors.push('Specialization is required');
  }

  if (qualification !== undefined && (!qualification || qualification.trim().length < 2)) {
    errors.push('Qualification is required');
  }

  if (dateOfBirth !== undefined) {
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      errors.push('Invalid date of birth format');
    } else if (dob > new Date()) {
      errors.push('Date of birth cannot be in the future');
    }
  }

  if (gender !== undefined) {
    const validGenders = ['male', 'female', 'other'];
    if (!validGenders.includes(gender.toLowerCase())) {
      errors.push('Invalid gender selected');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join('. ') });
  }

  next();
};
