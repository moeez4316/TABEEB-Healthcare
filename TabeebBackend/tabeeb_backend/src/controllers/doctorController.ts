import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { uploadProfileImage, deleteFromCloudinary } from '../services/uploadService';

export const createDoctor = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  const file = req.file; // Get uploaded file from multer
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
    addressStreet,
    addressCity,
    addressProvince,
    addressPostalCode,
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

  // Variables for cleanup
  let uploadedImagePublicId: string | null = null;

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

    // Step 1: Create database records in a transaction (atomic operation)
    const doctor = await prisma.$transaction(async (tx) => {
      // Check if user already exists, if not create it
      const existingUser = await tx.user.findUnique({ where: { uid: uid as string } });
      if (!existingUser) {
        await tx.user.create({
          data: { uid: uid as string, role: 'doctor' }
        });
      }
      
      // Create Doctor record (without image URLs yet)
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
          profileImageUrl: null, // Will update after Cloudinary upload
          profileImagePublicId: null,
        },
      });

      return newDoctor;
    });

    // Step 2: If file exists, upload to Cloudinary AFTER successful DB creation
    if (file) {
      try {
        const uploadResult = await uploadProfileImage(file.buffer, uid) as any;
        uploadedImagePublicId = uploadResult.public_id;
        
        // Step 3: Update doctor record with image URLs
        await prisma.doctor.update({
          where: { uid },
          data: {
            profileImageUrl: uploadResult.secure_url,
            profileImagePublicId: uploadResult.public_id
          }
        });

        // Update the doctor object to return with image URLs
        doctor.profileImageUrl = uploadResult.secure_url;
        doctor.profileImagePublicId = uploadResult.public_id;

      } catch (imageError) {
        console.error('Profile image upload error:', imageError);
        // Doctor is created successfully, just without image
        // This is acceptable - user can upload image later
      }
    }

    res.status(201).json(doctor);

  } catch (error) {
    console.error(error);
    
    // Cleanup: Delete uploaded image if it exists
    if (uploadedImagePublicId) {
      await deleteFromCloudinary(uploadedImagePublicId);
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
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }
    
    // Transform the response to include verification data in a more accessible format
    const response = {
      ...doctor,
      // Map verification fields to the expected format
      pmdcNumber: doctor.verification?.pmdcNumber || null,
      cnicNumber: doctor.verification?.cnicNumber || null,
      graduationYear: doctor.verification?.graduationYear || null,
      degreeInstitution: doctor.verification?.degreeInstitution || null,
      pmdcRegistrationDate: doctor.verification?.pmdcRegistrationDate || null,
      verificationStatus: doctor.verification?.status || 'not-submitted',
      isVerified: doctor.verification?.isVerified || false,
    };
    
    res.json(response);
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
      updateData.phone = updateData.phone?.trim() || null;
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

    // Handle profile image upload if provided
    if (updateData.profileImage && updateData.profileImage.startsWith('data:image/')) {
      try {
        // Convert base64 to buffer
        const base64Data = updateData.profileImage.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Upload to Cloudinary
        const uploadResult = await uploadProfileImage(imageBuffer, uid) as any;
        
        updateData.profileImageUrl = uploadResult.secure_url;
        updateData.profileImagePublicId = uploadResult.public_id;
      } catch (imageError) {
        console.error('Profile image upload error:', imageError);
        return res.status(500).json({ error: 'Failed to upload profile image' });
      }
    }
    
    // Always remove profileImage field to avoid Prisma validation error
    if ('profileImage' in updateData) {
      delete updateData.profileImage;
    }

    // Convert experience to string if provided
    if (updateData.experience !== undefined) {
      updateData.experience = updateData.experience ? String(updateData.experience) : null;
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
    res.status(500).json({ error: 'Failed to update doctor profile' });
  }
};

export const deleteDoctor = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  try {
    await prisma.doctor.delete({ where: { uid } });
    await prisma.user.delete({ where: { uid } });
    res.json({ message: 'Doctor account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete doctor profile' });
  }
};

// Get all verified doctors for patients to browse
export const getVerifiedDoctors = async (req: Request, res: Response) => {
  try {
    const { specialization, experience, search, sortBy = 'name', order = 'asc' } = req.query;
    
    // Build where clause for filtering
    const where: any = {
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
