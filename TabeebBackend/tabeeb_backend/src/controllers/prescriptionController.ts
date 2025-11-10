import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';


const medicineSchema = z.object({
  medicineName: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.string().min(1), // Keep as string for backward compatibility
  durationDays: z.number().int().positive(), // New field for duration in days
  instructions: z.string().optional(),
  timing: z.string().optional()
});

const createPrescriptionSchema = z.object({
  patientUid: z.string().min(1),
  appointmentId: z.string().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  instructions: z.string().optional(),
  medicines: z.array(medicineSchema).min(1)
});

const updatePrescriptionSchema = z.object({
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  instructions: z.string().optional(),
  medicines: z.array(medicineSchema).optional(),
  isActive: z.boolean().optional()
});

// Create a new prescription
export const createPrescription = async (req: Request, res: Response) => {
  try {
    const doctorUid = req.user?.uid;
    if (!doctorUid) {
      return res.status(401).json({ error: 'Unauthorized: Doctor ID required' });
    }

    const validatedData = createPrescriptionSchema.parse(req.body);

    const doctor = await prisma.doctor.findUnique({
      where: { uid: doctorUid },
      select: {
        uid: true,
        name: true,
        isActive: true
      }
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (!doctor.isActive) {
      return res.status(403).json({ error: 'Doctor account is deactivated' });
    }

    const patient = await prisma.patient.findUnique({
      where: { uid: validatedData.patientUid }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!patient.isActive) {
      return res.status(403).json({ error: 'Patient account is deactivated' });
    }

    const patientAge = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();

    if (validatedData.appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: validatedData.appointmentId }
      });

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      if (appointment.doctorUid !== doctorUid || appointment.patientUid !== validatedData.patientUid) {
        return res.status(403).json({ error: 'Unauthorized: Appointment does not belong to you' });
      }
    }

    // Calculate prescription end date based on maximum medicine duration
    const maxDuration = Math.max(...validatedData.medicines.map(med => med.durationDays));
    const prescriptionStartDate = new Date();
    const prescriptionEndDate = new Date();
    // For a 3-day prescription: Day 1, Day 2, Day 3 (so end on Day 3, not Day 4)
    prescriptionEndDate.setDate(prescriptionStartDate.getDate() + maxDuration - 1);

    const prescription = await prisma.prescription.create({
      data: {
        doctorUid,
        patientUid: validatedData.patientUid,
        appointmentId: validatedData.appointmentId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientAge: patientAge,
        patientGender: patient.gender,
        diagnosis: validatedData.diagnosis,
        notes: validatedData.notes,
        instructions: validatedData.instructions,
        prescriptionStartDate,
        prescriptionEndDate,
        medicines: {
          create: validatedData.medicines
        }
      },
      include: {
        medicines: true,
        doctor: {
          select: {
            name: true,
            specialization: true,
            qualification: true
          }
        },
        patient: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        appointment: {
          select: {
            appointmentDate: true,
            startTime: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: prescription
    });

  } catch (error) {
    console.error('Error creating prescription:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create prescription'
    });
  }
};

// Get all prescriptions for a doctor
export const getDoctorPrescriptions = async (req: Request, res: Response) => {
  try {
    const doctorUid = req.user?.uid;
    if (!doctorUid) {
      return res.status(401).json({ error: 'Unauthorized: Doctor ID required' });
    }

    const { page = 1, limit = 10, isActive = 'true' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const prescriptions = await prisma.prescription.findMany({
      where: {
        doctorUid,
        isActive: isActive === 'true'
      },
      include: {
        medicines: true,
        patient: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        appointment: {
          select: {
            appointmentDate: true,
            startTime: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limitNum
    });

    const totalCount = await prisma.prescription.count({
      where: {
        doctorUid,
        isActive: isActive === 'true'
      }
    });

    res.json({
      success: true,
      data: prescriptions,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
        hasPrevPage: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch prescriptions'
    });
  }
};

// Get all prescriptions for a patient
export const getPatientPrescriptions = async (req: Request, res: Response) => {
  try {
    const patientUid = req.user?.uid;
    if (!patientUid) {
      return res.status(401).json({ error: 'Unauthorized: Patient ID required' });
    }

    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const prescriptions = await prisma.prescription.findMany({
      where: {
        patientUid,
        isActive: true
      },
      include: {
        medicines: true,
        doctor: {
          select: {
            name: true,
            specialization: true,
            qualification: true,
            phone: true,
            email: true
          }
        },
        appointment: {
          select: {
            appointmentDate: true,
            startTime: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limitNum
    });

    // Add progress calculations to each prescription
    const prescriptionsWithProgress = prescriptions.map(prescription => {
      const now = new Date();
      const startDate = prescription.prescriptionStartDate || prescription.createdAt;
      let endDate = prescription.prescriptionEndDate;

      // Fallback: If endDate is missing, compute from medicines durationDays (max)
      if (!endDate && prescription.medicines && prescription.medicines.length > 0) {
        const durations = prescription.medicines
          .filter(m => typeof m.durationDays === 'number' && (m.durationDays as number) > 0)
          .map(m => m.durationDays as number);
        if (durations.length > 0) {
          const maxDays = Math.max(...durations);
          const computedEnd = new Date(startDate);
          // For a 3-day prescription: Day 1, Day 2, Day 3 (so end on Day 3, not Day 4)
          computedEnd.setDate(computedEnd.getDate() + maxDays - 1);
          endDate = computedEnd;
        }
      }

      // Calculate overall prescription progress
      let overallProgress = null;
      if (endDate) {
        // Reset time components for accurate day calculations
        const startDateOnly = new Date(startDate);
        const endDateOnly = new Date(endDate);
        const nowDateOnly = new Date(now);
        
        startDateOnly.setHours(0, 0, 0, 0);
        endDateOnly.setHours(23, 59, 59, 999);
        nowDateOnly.setHours(0, 0, 0, 0);
        
        const daysTotal = Math.ceil((endDateOnly.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate current day of prescription (1-based: Day 1, Day 2, Day 3, etc.)
        const currentDay = Math.floor((nowDateOnly.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Days remaining: how many days left including today (if prescription is active)
        let daysRemaining;
        if (nowDateOnly > endDateOnly) {
          daysRemaining = 0; // Prescription completed/expired
        } else {
          daysRemaining = daysTotal - currentDay + 1;
        }
        
        // Progress percentage: completed full days / total days
        // Day 1: 0% (just started), Day 2: 33% (1 day completed), Day 3: 67% (2 days completed), After Day 3: 100%
        const completedDays = Math.max(0, Math.min(currentDay - 1, daysTotal));
        const progressPercentage = (completedDays / daysTotal) * 100;

        let status = 'active';
        if (nowDateOnly > endDateOnly) {
          status = 'expired'; // After the last day ends
        } else if (daysRemaining === 1) {
          status = 'expiring'; // Last day of prescription
        }

        overallProgress = {
          status,
          daysRemaining,
          daysTotal,
          progressPercentage: Math.round(progressPercentage)
        };
      }

      // Calculate progress for each medicine
      const medicinesWithProgress = prescription.medicines.map(medicine => {
        if (!medicine.durationDays) {
          return { ...medicine, progress: null };
        }

        const medicineStartDate = new Date(startDate);
        const medicineEndDate = new Date(startDate);
        // For a 3-day medicine: Day 1, Day 2, Day 3 (so end on Day 3, not Day 4)
        medicineEndDate.setDate(medicineEndDate.getDate() + medicine.durationDays - 1);
        
        // Reset time components for accurate day calculations
        const startDateOnly = new Date(medicineStartDate);
        const endDateOnly = new Date(medicineEndDate);
        const nowDateOnly = new Date(now);
        
        startDateOnly.setHours(0, 0, 0, 0);
        endDateOnly.setHours(23, 59, 59, 999);
        nowDateOnly.setHours(0, 0, 0, 0);

        const daysTotal = medicine.durationDays;
        
        // Calculate current day of medicine (1-based: Day 1, Day 2, Day 3, etc.)
        const currentDay = Math.floor((nowDateOnly.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        // Days remaining: how many days left including today
        let daysRemaining;
        if (nowDateOnly > endDateOnly) {
          daysRemaining = 0; // Medicine completed/expired
        } else {
          daysRemaining = daysTotal - currentDay + 1;
        }
        
        // Progress percentage: completed full days / total days
        const completedDays = Math.max(0, Math.min(currentDay - 1, daysTotal));
        const progressPercentage = (completedDays / daysTotal) * 100;

        let status = 'active';
        if (nowDateOnly > endDateOnly) {
          status = 'expired'; // After the last day ends
        } else if (daysRemaining === 1) {
          status = 'expiring'; // Last day of medicine
        }

        return {
          ...medicine,
          progress: {
            status,
            daysRemaining,
            daysTotal,
            progressPercentage: Math.round(progressPercentage)
          }
        };
      });

      // Count active medicines
      const activeMedicines = medicinesWithProgress.filter(m => 
        m.progress && m.progress.status !== 'expired'
      ).length;

      return {
        ...prescription,
        medicines: medicinesWithProgress,
        overallProgress,
        activeMedicinesCount: activeMedicines,
        totalMedicinesCount: prescription.medicines.length
      };
    });

    const totalCount = await prisma.prescription.count({
      where: {
        patientUid,
        isActive: true
      }
    });

    res.json({
      success: true,
      data: prescriptionsWithProgress,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
        hasPrevPage: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch prescriptions'
    });
  }
};

export const getPrescriptionById = async (req: Request, res: Response) => {
  try {
    const { prescriptionId } = req.params;
    const userUid = req.user?.uid;

    if (!userUid) {
      return res.status(401).json({ error: 'Unauthorized: User ID required' });
    }

    // Database-level authorization: find prescription where user is either doctor or patient
    const prescription = await prisma.prescription.findFirst({
      where: {
        prescriptionId,
        OR: [
          { doctorUid: userUid },
          { patientUid: userUid }
        ]
      },
      include: {
        medicines: true,
        doctor: {
          select: {
            name: true,
            specialization: true,
            qualification: true,
            phone: true,
            email: true
          }
        },
        patient: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        appointment: {
          select: {
            appointmentDate: true,
            startTime: true,
            status: true
          }
        }
      }
    });

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found or access denied' });
    }

    res.json({
      success: true,
      data: prescription
    });

  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch prescription'
    });
  }
};

// Update a prescription
export const updatePrescription = async (req: Request, res: Response) => {
  try {
    const { prescriptionId } = req.params;
    const doctorUid = req.user?.uid;

    if (!doctorUid) {
      return res.status(401).json({ error: 'Unauthorized: Doctor ID required' });
    }

    // Check if doctor account is active
    const doctor = await prisma.doctor.findUnique({
      where: { uid: doctorUid },
      select: { isActive: true }
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (!doctor.isActive) {
      return res.status(403).json({ error: 'Doctor account is deactivated' });
    }

    const validatedData = updatePrescriptionSchema.parse(req.body);

    const existingPrescription = await prisma.prescription.findUnique({
      where: { prescriptionId },
      include: { medicines: true }
    });

    if (!existingPrescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    if (existingPrescription.doctorUid !== doctorUid) {
      return res.status(403).json({ error: 'Unauthorized: You can only update your own prescriptions' });
    }

    // Prepare update data
    const updateData: any = {
      diagnosis: validatedData.diagnosis,
      notes: validatedData.notes,
      instructions: validatedData.instructions,
      isActive: validatedData.isActive,
      updatedAt: new Date()
    };

    if (validatedData.medicines) {
      await prisma.prescriptionMedicine.deleteMany({
        where: { prescriptionId: existingPrescription.id }
      });

      updateData.medicines = {
        create: validatedData.medicines
      };

      // Recalculate prescription end date based on updated medicine durations (max durationDays)
      const hasDurationDays = validatedData.medicines.some(m => typeof m.durationDays === 'number' && m.durationDays! > 0);
      if (hasDurationDays) {
        const maxDurationDays = Math.max(
          ...validatedData.medicines
            .filter(m => typeof m.durationDays === 'number' && m.durationDays! > 0)
            .map(m => m.durationDays as number)
        );
        const startDate = existingPrescription.prescriptionStartDate ?? existingPrescription.createdAt;
        const newEndDate = new Date(startDate);
        // For a 3-day prescription: Day 1, Day 2, Day 3 (so end on Day 3, not Day 4)
        newEndDate.setDate(newEndDate.getDate() + maxDurationDays - 1);
        updateData.prescriptionEndDate = newEndDate;
      }
    }

    const updatedPrescription = await prisma.prescription.update({
      where: { prescriptionId },
      data: updateData,
      include: {
        medicines: true,
        doctor: {
          select: {
            name: true,
            specialization: true,
            qualification: true
          }
        },
        patient: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        appointment: {
          select: {
            appointmentDate: true,
            startTime: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Prescription updated successfully',
      data: updatedPrescription
    });

  } catch (error) {
    console.error('Error updating prescription:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update prescription'
    });
  }
};

// Soft delete a prescription (mark as inactive)
export const deletePrescription = async (req: Request, res: Response) => {
  try {
    const { prescriptionId } = req.params;
    const doctorUid = req.user?.uid;

    if (!doctorUid) {
      return res.status(401).json({ error: 'Unauthorized: Doctor ID required' });
    }

    // Check if doctor account is active
    const doctor = await prisma.doctor.findUnique({
      where: { uid: doctorUid },
      select: { isActive: true }
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (!doctor.isActive) {
      return res.status(403).json({ error: 'Doctor account is deactivated' });
    }

    const existingPrescription = await prisma.prescription.findUnique({
      where: { prescriptionId }
    });

    if (!existingPrescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    if (existingPrescription.doctorUid !== doctorUid) {
      return res.status(403).json({ error: 'Unauthorized: You can only delete your own prescriptions' });
    }

    await prisma.prescription.update({
      where: { prescriptionId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Prescription deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting prescription:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete prescription'
    });
  }
};

// Get prescriptions for a specific appointment
export const getAppointmentPrescriptions = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;
    const userUid = req.user?.uid;
    
    if (!userUid) {
      return res.status(401).json({ error: 'Unauthorized: User ID required' });
    }

    // First verify the user has access to this appointment
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        OR: [
          { doctorUid: userUid },
          { patientUid: userUid }
        ]
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found or access denied' });
    }

    // Get prescriptions for this appointment
    const prescriptions = await prisma.prescription.findMany({
      where: {
        appointmentId: appointmentId,
        isActive: true
      },
      include: {
        medicines: true,
        doctor: {
          select: {
            name: true,
            specialization: true,
            qualification: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: prescriptions
    });

  } catch (error) {
    console.error('Error fetching appointment prescriptions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch appointment prescriptions'
    });
  }
};

export const getPrescriptionStats = async (req: Request, res: Response) => {
  try {
    const doctorUid = req.user?.uid;
    if (!doctorUid) {
      return res.status(401).json({ error: 'Unauthorized: Doctor ID required' });
    }

    const [totalPrescriptions, activePrescriptions, thisMonthPrescriptions] = await Promise.all([
      prisma.prescription.count({
        where: { doctorUid }
      }),
      prisma.prescription.count({
        where: { doctorUid, isActive: true }
      }),
      prisma.prescription.count({
        where: {
          doctorUid,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalPrescriptions,
        activePrescriptions,
        inactivePrescriptions: totalPrescriptions - activePrescriptions,
        thisMonthPrescriptions
      }
    });

  } catch (error) {
    console.error('Error fetching prescription stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch prescription statistics'
    });
  }
};