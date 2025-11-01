import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { uploadProfileImage, deleteFromCloudinary } from '../services/uploadService';
import { v2 as cloudinary } from 'cloudinary';

// Create new patient profile
export const createPatient = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  const file = req.file; // Get uploaded file from multer
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
    emergencyContactName,
    emergencyContactRelationship,
    emergencyContactPhone,
    // Address
    addressStreet,
    addressCity,
    addressProvince,
    addressPostalCode,
    // Preferences
    language,
    notificationsEmail,
    notificationsSms,
    notificationsPush,
    privacyShareData,
    privacyMarketing
  } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'User UID is required' });
  }

  // Convert empty strings to null for email and phone
  const cleanEmail = email?.trim() || null;
  const cleanPhone = phone?.trim() || null;

  // Validate that at least email or phone is provided
  if (!cleanEmail && !cleanPhone) {
    return res.status(400).json({ 
      error: 'At least one of email or phone is required' 
    });
  }

  // Variables for cleanup
  let uploadedImagePublicId: string | null = null;

  try {
    // Parse JSON arrays if they come as strings from FormData
    const parsedAllergies = typeof allergies === 'string' ? JSON.parse(allergies || '[]') : (allergies || []);
    const parsedMedications = typeof medications === 'string' ? JSON.parse(medications || '[]') : (medications || []);
    const parsedMedicalConditions = typeof medicalConditions === 'string' ? JSON.parse(medicalConditions || '[]') : (medicalConditions || []);

    // Step 1: Validate and create database records in a transaction (atomic operation)
    const patient = await prisma.$transaction(async (tx) => {
      // Create or update User record
      await tx.user.upsert({
        where: { uid },
        create: { uid, role: 'patient' },
        update: { role: 'patient' }
      });

      // Create Patient record (without image URLs yet)
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
          profileImageUrl: null, // Will update after Cloudinary upload
          profileImagePublicId: null,
          
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
          emergencyContactPhone,
          
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

    // Step 2: If file exists, upload to Cloudinary AFTER successful DB creation
    if (file) {
      try {
        const uploadResult = await uploadProfileImage(file.buffer, uid) as any;
        uploadedImagePublicId = uploadResult.public_id;

        // Step 3: Update patient record with image URLs
        await prisma.patient.update({
          where: { uid },
          data: {
            profileImageUrl: uploadResult.secure_url,
            profileImagePublicId: uploadResult.public_id
          }
        });

        // Update the patient object to return with image URLs
        patient.profileImageUrl = uploadResult.secure_url;
        patient.profileImagePublicId = uploadResult.public_id;

      } catch (imageError) {
        console.error('Profile image upload error:', imageError);
        // Patient is created successfully, just without image
        // This is acceptable - user can upload image later
      }
    }

    res.status(201).json(patient);

  } catch (error) {
    console.error('Create patient error:', error);
    
    // Cleanup: Delete uploaded image if it exists
    if (uploadedImagePublicId) {
      await deleteFromCloudinary(uploadedImagePublicId);
    }

    res.status(500).json({ error: 'Failed to create patient profile' });
  }
};

// Get patient profile with profile image
export const getPatient = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  
  try {
    const patient = await prisma.patient.findUnique({ where: { uid } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    // Format response to match frontend structure
    const formattedPatient = {
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: patient.phone || '',
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
        phone: patient.emergencyContactPhone || ''
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
    // Convert empty strings to null for email and phone
    const cleanEmail = email?.trim() || null;
    const cleanPhone = phone?.trim() || null;

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
        emergencyContactPhone: emergencyContact?.phone,
        
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
    res.status(500).json({ error: 'Failed to update patient profile' });
  }
};

// Upload profile image
export const uploadPatientProfileImage = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  const file = req.file;

  if (!uid) {
    return res.status(400).json({ error: 'User UID is required' });
  }

  if (!file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  try {
    // Check if patient exists
    const patient = await prisma.patient.findUnique({ where: { uid } });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Delete old profile image from Cloudinary if exists
    if (patient.profileImagePublicId) {
      await cloudinary.uploader.destroy(patient.profileImagePublicId);
    }

    // Upload new image to Cloudinary
    const uploadResult = await uploadProfileImage(file.buffer, uid) as any;

    // Update patient record with new image data
    await prisma.patient.update({
      where: { uid },
      data: { 
        profileImageUrl: uploadResult.secure_url,
        profileImagePublicId: uploadResult.public_id
      }
    });

    res.json({
      message: 'Profile image uploaded successfully',
      imageUrl: uploadResult.secure_url
    });

  } catch (error) {
    console.error('Upload profile image error:', error);
    res.status(500).json({ error: 'Failed to upload profile image' });
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

// Delete patient profile
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

    // Delete profile image from Cloudinary if exists
    if (patient.profileImagePublicId) {
      await cloudinary.uploader.destroy(patient.profileImagePublicId);
    }

    // Delete patient and user records
    await prisma.patient.delete({ where: { uid } });
    await prisma.user.delete({ where: { uid } });
    
    res.json({ message: 'Patient account deleted successfully' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ error: 'Failed to delete patient profile' });
  }
};
