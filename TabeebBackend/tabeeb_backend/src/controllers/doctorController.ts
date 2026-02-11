import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { deleteFromCloudinary, verifyPublicIdOwnership, buildCloudinaryUrl } from '../services/uploadService';
import { normalizePhoneForDB, formatPhoneForDisplay } from '../utils/phoneUtils';

export const createDoctor = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  const { 
    firstName, 
    lastName, 
    name, 
    email, 
    phone, 
    dateOfBirth,
    gender,
    specialization, 
    qualification, 
    experience,
    hourlyConsultationRate,
    followUpPercentage,
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

  try {
    // Validate required fields BEFORE any database operations
    if (!firstName || !lastName || !specialization || !qualification) {
      return res.status(400).json({ 
        error: 'Required fields missing: firstName, lastName, specialization, qualification' 
      });
    }

    // Validate that at least email or phone is provided
    if (!cleanEmail && !cleanPhone) {
      return res.status(400).json({ 
        error: 'At least one of email or phone is required' 
      });
    }

    // Address validation
    if (addressPostalCode && !/^\d{5}$/.test(addressPostalCode)) {
      return res.status(400).json({ error: 'Postal code must be exactly 5 digits' });
    }

    // Validate hourly consultation rate if provided
    if (hourlyConsultationRate !== undefined && hourlyConsultationRate !== null) {
      const rate = parseFloat(hourlyConsultationRate);
      if (isNaN(rate) || rate < 0) {
        return res.status(400).json({ error: 'Hourly consultation rate must be a positive number' });
      }
      if (rate > 50000) {
        return res.status(400).json({ error: 'Hourly consultation rate cannot exceed PKR 50,000' });
      }
    }

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

    // Check if doctor already exists for this UID
    const existingDoctor = await prisma.doctor.findUnique({ where: { uid } });
    
    if (existingDoctor) {
      return res.status(409).json({ 
        error: 'Doctor profile already exists for this user',
        existing: true
      });
    }

    // If phone is provided, check if it belongs to another doctor
    if (cleanPhone) {
      const phoneConflict = await prisma.doctor.findUnique({ 
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
    const doctor = await prisma.$transaction(async (tx) => {
      // Check if user already exists, if not create it
      const existingUser = await tx.user.findUnique({ where: { uid: uid as string } });
      if (!existingUser) {
        await tx.user.create({
          data: { uid: uid as string, role: 'doctor' }
        });
      }
      
      // Create Doctor record (now safe since we checked for conflicts)
      const newDoctor = await tx.doctor.create({
        data: {
          uid: uid as string,
          firstName,
          lastName,
          name: name || `${firstName} ${lastName}`,
          email: cleanEmail,
          phone: cleanPhone,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender,
          specialization,
          qualification,
          experience: experience ? String(experience) : null,
          hourlyConsultationRate: hourlyConsultationRate ? parseFloat(hourlyConsultationRate) : null,
          followUpPercentage: followUpPercentage ? parseInt(followUpPercentage) : 50,
          addressStreet,
          addressCity,
          addressProvince,
          addressPostalCode,
          language: language || 'English',
          notificationsEmail: notificationsEmail !== undefined ? notificationsEmail === 'true' || notificationsEmail === true : true,
          notificationsSms: notificationsSms !== undefined ? notificationsSms === 'true' || notificationsSms === true : true,
          notificationsPush: notificationsPush !== undefined ? notificationsPush === 'true' || notificationsPush === true : true,
          privacyShareData: privacyShareData === 'true' || privacyShareData === true || false,
          privacyMarketing: privacyMarketing === 'true' || privacyMarketing === true || false,
          profileImageUrl: validatedImageUrl,
          profileImagePublicId: validatedImagePublicId,
        },
      });

      return newDoctor;
    });

    res.status(201).json(doctor);

  } catch (error) {
    console.error(error);
    
    // Handle Prisma unique constraint violations more specifically
    if (error.code === 'P2002') {
      if (error.meta?.target?.includes('phone')) {
        return res.status(409).json({ 
          error: 'This phone number is already registered with another account' 
        });
      }
      if (error.meta?.target?.includes('uid')) {
        return res.status(409).json({ 
          error: 'Doctor profile already exists for this user' 
        });
      }
    }
    
    res.status(500).json({ error: 'Failed to create doctor profile' });
  }
};

export const getDoctor = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  try {
    const doctor = await prisma.doctor.findUnique({ 
      where: { uid },
      include: {
        verification: true // Include verification data if exists
      }
    });
    
    if (!doctor || !doctor.isActive) {
      return res.status(404).json({ message: 'Doctor profile not found or deactivated' });
    }
    
    // Transform the response to include verification data in a more accessible format
    const response = {
      ...doctor,
      phone: formatPhoneForDisplay(doctor.phone),
      // Map verification fields to the expected format
      pmdcNumber: doctor.verification?.pmdcNumber || null,
      cnicNumber: doctor.verification?.cnicNumber || null,
      graduationYear: doctor.verification?.graduationYear || null,
      degreeInstitution: doctor.verification?.degreeInstitution || null,
      pmdcRegistrationDate: doctor.verification?.pmdcRegistrationDate || null,
      verificationStatus: doctor.verification?.status || 'not-submitted',
      isVerified: doctor.verification?.isVerified || false,
    };    res.json(response);
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    res.status(500).json({ error: 'Failed to fetch doctor profile' });
  }
};

export const updateDoctor = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  
  if (!uid) {
    return res.status(400).json({ error: 'User UID is required' });
  }
  
  try {
    // Check if account is active
    const existingDoctor = await prisma.doctor.findUnique({ where: { uid } });
    if (!existingDoctor || !existingDoctor.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Handle date conversion if dateOfBirth is provided
    const updateData = { ...req.body };
    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }

    // Convert empty strings to null for email and phone
    if ('email' in updateData) {
      updateData.email = updateData.email?.trim() || null;
    }
    if ('phone' in updateData) {
      updateData.phone = normalizePhoneForDB(updateData.phone);
    }

    // Validate address fields if provided
    if (updateData.address) {
      const { street, city, province, postalCode } = updateData.address;
      updateData.addressStreet = street;
      updateData.addressCity = city;
      updateData.addressProvince = province; 
      updateData.addressPostalCode = postalCode;
      delete updateData.address; // Remove nested object
    }

    // Individual address field validation
    if (updateData.addressPostalCode && !/^\d{5}$/.test(updateData.addressPostalCode)) {
      return res.status(400).json({ error: 'Postal code must be exactly 5 digits' });
    }

    // Handle profile image update if publicId provided (client-side upload)
    if (updateData.profileImagePublicId) {
      if (!verifyPublicIdOwnership(updateData.profileImagePublicId, uid, 'profile-image')) {
        return res.status(403).json({ error: 'Invalid profile image. Please upload again.' });
      }
      
      // Delete old profile image if exists
      if (existingDoctor.profileImagePublicId) {
        await deleteFromCloudinary(existingDoctor.profileImagePublicId);
      }
      
      updateData.profileImageUrl = updateData.profileImageUrl || buildCloudinaryUrl(updateData.profileImagePublicId, 'image');
    }
    
    // Remove legacy profileImage field if present
    if ('profileImage' in updateData) {
      delete updateData.profileImage;
    }

    // Convert experience to string if provided
    if (updateData.experience !== undefined) {
      updateData.experience = updateData.experience ? String(updateData.experience) : null;
    }

    // Validate and convert hourly consultation rate if provided
    if ('hourlyConsultationRate' in updateData) {
      if (updateData.hourlyConsultationRate === null || updateData.hourlyConsultationRate === '') {
        updateData.hourlyConsultationRate = null;
      } else {
        const rate = parseFloat(updateData.hourlyConsultationRate);
        if (isNaN(rate) || rate < 0) {
          return res.status(400).json({ error: 'Hourly consultation rate must be a positive number' });
        }
        if (rate > 50000) {
          return res.status(400).json({ error: 'Hourly consultation rate cannot exceed PKR 50,000' });
        }
        updateData.hourlyConsultationRate = rate;
      }
    }

    // Validate and convert follow-up percentage if provided
    if ('followUpPercentage' in updateData) {
      if (updateData.followUpPercentage === null || updateData.followUpPercentage === '') {
        updateData.followUpPercentage = 50; // Default to 50%
      } else {
        const percentage = parseInt(updateData.followUpPercentage);
        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
          return res.status(400).json({ error: 'Follow-up percentage must be between 0 and 100' });
        }
        updateData.followUpPercentage = percentage;
      }
    }

    // Ensure name is updated if firstName or lastName changes
    if (updateData.firstName || updateData.lastName) {
      const currentDoctor = await prisma.doctor.findUnique({ where: { uid } });
      const firstName = updateData.firstName || currentDoctor?.firstName || '';
      const lastName = updateData.lastName || currentDoctor?.lastName || '';
      updateData.name = `${firstName} ${lastName}`.trim();
    }

    const doctor = await prisma.doctor.update({
      where: { uid },
      data: updateData,
    });
    res.json(doctor);
  } catch (error) {
    console.error('Update doctor error:', error);
    
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
    
    res.status(500).json({ error: 'Failed to update doctor profile' });
  }
};

export const deleteDoctor = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  
  if (!uid) {
    return res.status(400).json({ error: 'User UID is required' });
  }

  try {
    // Soft delete: Set isActive to false instead of removing from database
    const doctor = await prisma.doctor.update({
      where: { uid },
      data: { 
        isActive: false,
        updatedAt: new Date()
      }
    });

    res.json({ 
      message: 'Doctor account deactivated successfully',
      doctor: {
        uid: doctor.uid,
        name: doctor.name,
        isActive: doctor.isActive
      }
    });
  } catch (error) {
    console.error('Error deactivating doctor profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to deactivate doctor profile',
      details: errorMessage
    });
  }
};

// Restore soft-deleted doctor account
export const restoreDoctor = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  
  if (!uid) {
    return res.status(400).json({ error: 'User UID is required' });
  }

  try {
    const doctor = await prisma.doctor.update({
      where: { uid },
      data: { 
        isActive: true,
        updatedAt: new Date()
      }
    });

    res.json({ 
      message: 'Doctor account restored successfully',
      doctor: {
        uid: doctor.uid,
        name: doctor.name,
        isActive: doctor.isActive
      }
    });
  } catch (error) {
    console.error('Error restoring doctor profile:', error);
    res.status(500).json({ error: 'Failed to restore doctor profile' });
  }
};

// Get all verified doctors for patients to browse
export const getVerifiedDoctors = async (req: Request, res: Response) => {
  try {
    const { specialization, experience, search, sortBy = 'name', order = 'asc' } = req.query;
    
    // Build where clause for filtering
    const where: any = {
      isActive: true, // Only show active doctors
      verification: {
        status: 'approved',
        isVerified: true
      }
    };

    // Add specialization filter
    if (specialization && specialization !== 'all') {
      where.specialization = {
        contains: specialization as string,
        mode: 'insensitive'
      };
    }

    // Add experience filter
    if (experience) {
      const expValue = parseInt(experience as string);
      if (!isNaN(expValue)) {
        where.experience = {
          gte: expValue
        };
      }
    }

    // Add search filter (name or specialization)
    if (search) {
      where.OR = [
        {
          name: {
            contains: search as string,
            mode: 'insensitive'
          }
        },
        {
          specialization: {
            contains: search as string,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'experience') {
      orderBy.experience = order;
    } else if (sortBy === 'specialization') {
      orderBy.specialization = order;
    } else {
      orderBy.name = order;
    }

    const doctors = await prisma.doctor.findMany({
      where,
      orderBy,
      select: {
        uid: true,
        firstName: true,
        lastName: true,
        name: true,
        specialization: true,
        qualification: true,
        experience: true,
        hourlyConsultationRate: true,
        profileImageUrl: true,
        addressCity: true,
        addressProvince: true,
        createdAt: true,
        verification: {
          select: {
            status: true,
            isVerified: true
          }
        }
      }
    });

    // Get unique specializations for filter options
    const specializations = await prisma.doctor.findMany({
      where: {
        isActive: true,
        verification: {
          status: 'approved',
          isVerified: true
        }
      },
      select: {
        specialization: true
      },
      distinct: ['specialization']
    });

    res.json({
      doctors,
      filterOptions: {
        specializations: specializations.map(s => s.specialization).sort()
      },
      total: doctors.length
    });
  } catch (error) {
    console.error('Error fetching verified doctors:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
};

// Update profile image after client-side Cloudinary upload
// POST/PUT /api/doctor/profile-image
// Body: { publicId, url? }
export const updateDoctorProfileImage = async (req: Request, res: Response) => {
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
    // Check if doctor exists
    const doctor = await prisma.doctor.findUnique({ where: { uid } });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Delete old profile image from Cloudinary if exists
    if (doctor.profileImagePublicId) {
      await deleteFromCloudinary(doctor.profileImagePublicId);
    }

    // Build URL from publicId
    const imageUrl = url || buildCloudinaryUrl(publicId, 'image');

    // Update doctor record with new image data
    await prisma.doctor.update({
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
export const deleteDoctorProfileImage = async (req: Request, res: Response) => {
  const uid = req.user?.uid;

  if (!uid) {
    return res.status(400).json({ error: 'User UID is required' });
  }

  try {
    // Check if doctor exists
    const doctor = await prisma.doctor.findUnique({ where: { uid } });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Delete image from Cloudinary if exists
    if (doctor.profileImagePublicId) {
      await deleteFromCloudinary(doctor.profileImagePublicId);
    }

    // Update doctor record to remove image data
    await prisma.doctor.update({
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
