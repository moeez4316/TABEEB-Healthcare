import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { deleteFromCloudinary, verifyPublicIdOwnership, buildCloudinaryUrl } from '../services/uploadService';
import { v2 as cloudinary } from 'cloudinary';
import { normalizePhoneForDB, formatPhoneForDisplay } from '../utils/phoneUtils';

export const createPatient = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  const { 
    firstName, 
    lastName, 
    email, 
    phone, 
    cnic,
    dateOfBirth, 
    gender,
    bloodType,
    height,
    weight,
    allergies,
    medications,
    medicalConditions,
    emergencyContactName,
    emergencyContactRelationship,
    emergencyContactPhone,
    addressStreet,
    addressCity,
    addressProvince,
    addressPostalCode,
    language,
    notificationsEmail,
    notificationsSms,
    notificationsPush,
    privacyShareData,
    privacyMarketing,
    // Client-side uploaded profile image
    profileImagePublicId,
    profileImageUrl
  } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'User UID is required' });
  }

  // Convert empty strings to null for email and phone
  const cleanEmail = email?.trim() || null;
  const cleanPhone = normalizePhoneForDB(phone);
  const cleanEmergencyPhone = normalizePhoneForDB(emergencyContactPhone);

  // Validate that at least email or phone is provided
  if (!cleanEmail && !cleanPhone) {
    return res.status(400).json({ 
      error: 'At least one of email or phone is required' 
    });
  }

  try {
    // Parse JSON arrays if they come as strings from FormData
    const parsedAllergies = typeof allergies === 'string' ? JSON.parse(allergies || '[]') : (allergies || []);
    const parsedMedications = typeof medications === 'string' ? JSON.parse(medications || '[]') : (medications || []);
    const parsedMedicalConditions = typeof medicalConditions === 'string' ? JSON.parse(medicalConditions || '[]') : (medicalConditions || []);

    // Verify profile image ownership if provided
    let validatedImageUrl = null;
    let validatedImagePublicId = null;
    
    if (profileImagePublicId) {
      if (!verifyPublicIdOwnership(profileImagePublicId, uid, 'profile-image')) {
        return res.status(403).json({ error: 'Invalid profile image. Please upload again.' });
      }
      validatedImagePublicId = profileImagePublicId;
      validatedImageUrl = profileImageUrl || buildCloudinaryUrl(profileImagePublicId, 'image');
    }

    // Check if patient already exists for this UID
    const existingPatient = await prisma.patient.findUnique({ where: { uid } });
    
    if (existingPatient) {
      return res.status(409).json({ 
        error: 'Patient profile already exists for this user',
        existing: true
      });
    }

    // If phone is provided, check if it belongs to another patient
    if (cleanPhone) {
      const phoneConflict = await prisma.patient.findUnique({ 
        where: { phone: cleanPhone },
        select: { uid: true } 
      });
      
      if (phoneConflict && phoneConflict.uid !== uid) {
        return res.status(409).json({ 
          error: 'This phone number is already registered with another account' 
        });
      }
    }

    // Create database records in a transaction (atomic operation)
    const patient = await prisma.$transaction(async (tx) => {
      // Create or update User record
      await tx.user.upsert({
        where: { uid },
        create: { uid, role: 'patient' },
        update: { role: 'patient' }
      });

      // Create Patient record (now safe since we checked for conflicts)
      const newPatient = await tx.patient.create({
        data: {
          uid,
          firstName,
          lastName,
          email: cleanEmail,
          phone: cleanPhone,
          cnic,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          profileImageUrl: validatedImageUrl,
          profileImagePublicId: validatedImagePublicId,
          
          // Medical Information
          bloodType,
          height,
          weight,
          allergies: parsedAllergies,
          medications: parsedMedications,
          medicalConditions: parsedMedicalConditions,
          
          // Emergency Contact
          emergencyContactName,
          emergencyContactRelationship,
          emergencyContactPhone: cleanEmergencyPhone,
          
          // Address
          addressStreet,
          addressCity,
          addressProvince,
          addressPostalCode,
          
          // Preferences
          language: language || 'English',
          notificationsEmail: notificationsEmail !== undefined ? notificationsEmail === 'true' || notificationsEmail === true : true,
          notificationsSms: notificationsSms !== undefined ? notificationsSms === 'true' || notificationsSms === true : true,
          notificationsPush: notificationsPush !== undefined ? notificationsPush === 'true' || notificationsPush === true : true,
          privacyShareData: privacyShareData === 'true' || privacyShareData === true || false,
          privacyMarketing: privacyMarketing === 'true' || privacyMarketing === true || false,
        },
      });

      return newPatient;
    });

    res.status(201).json(patient);

  } catch (error: unknown) {
    console.error('Create patient error:', error);
    
    // Handle Prisma unique constraint violations more specifically
    const prismaError = error as { code?: string; meta?: { target?: string[] } };
    if (prismaError.code === 'P2002') {
      if (prismaError.meta?.target?.includes('phone')) {
        return res.status(409).json({ 
          error: 'This phone number is already registered with another account' 
        });
      }
      if (prismaError.meta?.target?.includes('uid')) {
        return res.status(409).json({ 
          error: 'Patient profile already exists for this user' 
        });
      }
    }
    
    res.status(500).json({ error: 'Failed to create patient profile' });
  }
};

// Get patient profile with profile image
export const getPatient = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  
  try {
    const patient = await prisma.patient.findUnique({ where: { uid } });
    if (!patient || !patient.isActive) return res.status(404).json({ error: 'Patient not found or deactivated' });

    // Format response to match frontend structure
    const formattedPatient = {
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: formatPhoneForDisplay(patient.phone),
      cnic: patient.cnic || '',
      dateOfBirth: patient.dateOfBirth.toISOString().split('T')[0],
      gender: patient.gender,
      profileImage: patient.profileImageUrl || '',
      
      // Medical Information
      bloodType: patient.bloodType || '',
      height: patient.height || '',
      weight: patient.weight || '',
      allergies: patient.allergies || [],
      medications: patient.medications || [],
      medicalConditions: patient.medicalConditions || [],
      
      // Emergency Contact
      emergencyContact: {
        name: patient.emergencyContactName || '',
        relationship: patient.emergencyContactRelationship || '',
        phone: formatPhoneForDisplay(patient.emergencyContactPhone)
      },
      
      // Address
      address: {
        street: patient.addressStreet || '',
        city: patient.addressCity || '',
        province: patient.addressProvince || '',
        postalCode: patient.addressPostalCode || ''
      },
      
      // Preferences
      language: patient.language,
      notifications: {
        email: patient.notificationsEmail,
        sms: patient.notificationsSms,
        push: patient.notificationsPush
      },
      privacy: {
        shareDataForResearch: patient.privacyShareData,
        allowMarketing: patient.privacyMarketing
      }
    };

    res.json(formattedPatient);
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Failed to fetch patient profile' });
  }
};

// Update patient profile
export const updatePatient = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  const { 
    firstName, 
    lastName, 
    email, 
    phone, 
    cnic,
    dateOfBirth, 
    gender,
    // Medical Information
    bloodType,
    height,
    weight,
    allergies,
    medications,
    medicalConditions,
    // Emergency Contact
    emergencyContact,
    // Address
    address,
    // Preferences
    language,
    notifications,
    privacy
  } = req.body;

  try {
    // Check if account is active
    const existingPatient = await prisma.patient.findUnique({ where: { uid } });
    if (!existingPatient || !existingPatient.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Convert empty strings to null for email and phone
    const cleanEmail = email?.trim() || null;
    const cleanPhone = normalizePhoneForDB(phone);
    const cleanEmergencyPhone = emergencyContact?.phone ? normalizePhoneForDB(emergencyContact.phone) : undefined;

    // Validate that at least email or phone exists when updating
    if (email !== undefined && phone !== undefined && !cleanEmail && !cleanPhone) {
      return res.status(400).json({ 
        error: 'At least one of email or phone is required' 
      });
    }

    const patient = await prisma.patient.update({
      where: { uid },
      data: {
        firstName,
        lastName,
        email: cleanEmail,
        phone: cleanPhone,
        cnic,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        
        // Medical Information
        bloodType,
        height,
        weight,
        allergies: allergies || [],
        medications: medications || [],
        medicalConditions: medicalConditions || [],
        
        // Emergency Contact
        emergencyContactName: emergencyContact?.name,
        emergencyContactRelationship: emergencyContact?.relationship,
        emergencyContactPhone: cleanEmergencyPhone,
        
        // Address
        addressStreet: address?.street,
        addressCity: address?.city,
        addressProvince: address?.province,
        addressPostalCode: address?.postalCode,
        
        // Preferences
        language: language || 'English',
        notificationsEmail: notifications?.email ?? true,
        notificationsSms: notifications?.sms ?? true,
        notificationsPush: notifications?.push ?? true,
        privacyShareData: privacy?.shareDataForResearch ?? false,
        privacyMarketing: privacy?.allowMarketing ?? false,
      },
    });
    res.json(patient);
  } catch (error) {
    console.error('Update patient error:', error);
    
    // Handle unique constraint violations (Prisma error code P2002)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      const prismaError = error as { code: string; meta?: { target?: string | string[] } };
      const target = prismaError.meta?.target;
      const targetStr = Array.isArray(target) ? target.join(',') : String(target || '');
      
      if (targetStr.includes('email')) {
        return res.status(409).json({ error: 'This email is already registered with another account' });
      } else if (targetStr.includes('phone')) {
        return res.status(409).json({ error: 'This phone number is already registered with another account' });
      }
      return res.status(409).json({ error: 'This information is already registered with another account' });
    }
    
    res.status(500).json({ error: 'Failed to update patient profile' });
  }
};

// Update profile image after client-side Cloudinary upload
// POST/PUT /api/patient/profile-image
// Body: { publicId, url? }
export const updatePatientProfileImage = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  
  // Defensive check for body parsing
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ 
      error: 'Request body is required. Ensure Content-Type is application/json' 
    });
  }
  
  const { publicId, url } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'User UID is required' });
  }

  if (!publicId) {
    return res.status(400).json({ error: 'publicId is required' });
  }

  // Verify ownership
  if (!verifyPublicIdOwnership(publicId, uid, 'profile-image')) {
    return res.status(403).json({ error: 'Invalid publicId. Please upload again.' });
  }

  try {
    // Check if patient exists
    const patient = await prisma.patient.findUnique({ where: { uid } });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Delete old profile image from Cloudinary if exists
    if (patient.profileImagePublicId) {
      await deleteFromCloudinary(patient.profileImagePublicId);
    }

    // Build URL from publicId
    const imageUrl = url || buildCloudinaryUrl(publicId, 'image');

    // Update patient record with new image data
    await prisma.patient.update({
      where: { uid },
      data: { 
        profileImageUrl: imageUrl,
        profileImagePublicId: publicId
      }
    });

    res.json({
      message: 'Profile image updated successfully',
      imageUrl,
      publicId
    });

  } catch (error) {
    console.error('Update profile image error:', error);
    res.status(500).json({ error: 'Failed to update profile image' });
  }
};

// Delete profile image
export const deletePatientProfileImage = async (req: Request, res: Response) => {
  const uid = req.user?.uid;

  if (!uid) {
    return res.status(400).json({ error: 'User UID is required' });
  }

  try {
    const patient = await prisma.patient.findUnique({ where: { uid } });
    if (!patient || !patient.profileImagePublicId) {
      return res.status(404).json({ error: 'Patient not found or no profile image to delete' });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(patient.profileImagePublicId);

    // Update patient record to remove image data
    await prisma.patient.update({
      where: { uid },
      data: { 
        profileImageUrl: null,
        profileImagePublicId: null
      }
    });

    res.json({ message: 'Profile image deleted successfully' });

  } catch (error) {
    console.error('Delete profile image error:', error);
    res.status(500).json({ error: 'Failed to delete profile image' });
  }
};

// Delete patient profile (soft delete)
export const deletePatient = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  
  if (!uid) {
    return res.status(400).json({ error: 'User UID is required' });
  }
  
  try {
    const patient = await prisma.patient.findUnique({ where: { uid } });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Soft delete: Set isActive to false instead of removing from database
    await prisma.patient.update({
      where: { uid },
      data: { 
        isActive: false,
        updatedAt: new Date()
      }
    });
    
    res.json({ 
      message: 'Patient account deactivated successfully',
      patient: {
        uid: patient.uid,
        firstName: patient.firstName,
        lastName: patient.lastName,
        isActive: false
      }
    });
  } catch (error) {
    console.error('Error deactivating patient profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to deactivate patient profile',
      details: errorMessage
    });
  }
};

// Restore soft-deleted patient account
export const restorePatient = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  
  if (!uid) {
    return res.status(400).json({ error: 'User UID is required' });
  }

  try {
    const patient = await prisma.patient.update({
      where: { uid },
      data: { 
        isActive: true,
        updatedAt: new Date()
      }
    });

    res.json({ 
      message: 'Patient account restored successfully',
      patient: {
        uid: patient.uid,
        firstName: patient.firstName,
        lastName: patient.lastName,
        isActive: patient.isActive
      }
    });
  } catch (error) {
    console.error('Error restoring patient profile:', error);
    res.status(500).json({ error: 'Failed to restore patient profile' });
  }
};
