import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { uploadProfileImage } from '../services/uploadService';
import { v2 as cloudinary } from 'cloudinary';

// Create new patient profile
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
    profileImage, // Base64 image data
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

  if (!uid) {
    return res.status(400).json({ error: 'User UID is required' });
  }

  try {
    // Create User record if doesn't exist
    await prisma.user.upsert({
      where: { uid },
      create: { uid, role: 'patient' },
      update: { role: 'patient' }
    });

    // Handle profile image upload if provided
    let profileImageUrl = null;
    let profileImagePublicId = null;
    if (profileImage && profileImage.startsWith('data:image/')) {
      try {
        // Convert base64 to buffer
        const base64Data = profileImage.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Upload to Cloudinary
        const uploadResult = await uploadProfileImage(imageBuffer, uid) as any;

        // Store image URL and public ID directly
        profileImageUrl = uploadResult.secure_url;
        profileImagePublicId = uploadResult.public_id;
      } catch (imageError) {
        console.error('Profile image upload error:', imageError);
        // Continue with patient creation even if image upload fails
      }
    }

    const patient = await prisma.patient.create({
      data: {
        uid,
        firstName,
        lastName,
        email,
        phone,
        cnic,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        profileImageUrl,
        profileImagePublicId,
        
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

    res.status(201).json(patient);
  } catch (error) {
    console.error('Create patient error:', error);
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
    const patient = await prisma.patient.update({
      where: { uid },
      data: {
        firstName,
        lastName,
        email,
        phone,
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
