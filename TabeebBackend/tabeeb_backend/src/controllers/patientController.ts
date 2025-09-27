import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import ProfileImage from '../models/ProfileImage';
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

    // Get profile image if exists
    let profileImage = null;
    if (patient.profileImageId) {
      profileImage = await ProfileImage.findById(patient.profileImageId);
    }

    // Format response to match frontend structure
    const formattedPatient = {
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: patient.phone || '',
      cnic: patient.cnic || '',
      dateOfBirth: patient.dateOfBirth.toISOString().split('T')[0],
      gender: patient.gender,
      profileImage: profileImage?.imageUrl || '',
      
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

    // Delete old profile image if exists
    if (patient.profileImageId) {
      const oldImage = await ProfileImage.findById(patient.profileImageId);
      if (oldImage) {
        // Delete from Cloudinary
        await cloudinary.uploader.destroy(oldImage.publicId);
        // Delete from MongoDB
        await ProfileImage.findByIdAndDelete(patient.profileImageId);
      }
    }

    // Upload new image to Cloudinary
    const uploadResult = await uploadProfileImage(file.buffer, uid) as any;

    // Save image metadata to MongoDB
    const profileImage = await ProfileImage.create({
      userId: uid,
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      bytes: uploadResult.bytes
    });

    // Update patient record with profile image ID
    await prisma.patient.update({
      where: { uid },
      data: { profileImageId: profileImage._id.toString() }
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
    if (!patient || !patient.profileImageId) {
      return res.status(404).json({ error: 'No profile image found' });
    }

    // Find image in MongoDB
    const profileImage = await ProfileImage.findById(patient.profileImageId);
    if (profileImage) {
      // Delete from Cloudinary
      await cloudinary.uploader.destroy(profileImage.publicId);
      // Delete from MongoDB
      await ProfileImage.findByIdAndDelete(patient.profileImageId);
    }

    // Remove profile image ID from patient record
    await prisma.patient.update({
      where: { uid },
      data: { profileImageId: null }
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

    // Delete profile image if exists
    if (patient.profileImageId) {
      const profileImage = await ProfileImage.findById(patient.profileImageId);
      if (profileImage) {
        await cloudinary.uploader.destroy(profileImage.publicId);
        await ProfileImage.findByIdAndDelete(patient.profileImageId);
      }
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
