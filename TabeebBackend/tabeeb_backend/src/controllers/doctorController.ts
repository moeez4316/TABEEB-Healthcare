import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const createDoctor = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  const { name, email, phone, specialization, qualification, experience } = req.body;

  if (!uid) {
    return res.status(400).json({ error: 'User UID is required' });
  }

  try {
    // Only create User and Doctor when onboarding form is submitted
    await prisma.user.create({
      data: { uid: uid as string, role: 'doctor' }
    });
    const doctor = await prisma.doctor.create({
      data: {
        uid: uid as string,
        name,
        email,
        phone,
        specialization,
        qualification,
        experience,
      },
    });
    res.status(201).json(doctor);
  } catch (error) {
    console.error(error);
    res.status(506).json({ error: 'Failed to create doctor profile' });
  }
};

export const getDoctor = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  try {
    const doctor = await prisma.doctor.findUnique({ where: { uid } });
    console.log('[TABEEB DEBUG] doctorController: Prisma doctor query result:', doctor);
    if (!doctor) {
      console.log('[TABEEB DEBUG] doctorController: No doctor profile found for UID:', uid);
      return res.status(404).json({ message: 'Doctor profile not found' });
    }
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctor profile' });
  }
};

export const updateDoctor = async (req: Request, res: Response) => {
  const uid = req.user?.uid;
  try {
    const doctor = await prisma.doctor.update({
      where: { uid },
      data: req.body,
    });
    res.json(doctor);
  } catch (error) {
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
        name: true,
        specialization: true,
        qualification: true,
        experience: true,
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
