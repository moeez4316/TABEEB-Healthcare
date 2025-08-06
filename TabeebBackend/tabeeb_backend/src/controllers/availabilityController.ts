import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { generateTimeSlots } from '../utils/timeSlotGenerator';

// Doctor sets availability for a specific date
export const setDoctorAvailability = async (req: Request, res: Response) => {
  const doctorUid = req.user?.uid;
  const { date, startTime, endTime, slotDuration = 30, breakStartTime, breakEndTime } = req.body;

  if (!doctorUid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Check if availability already exists for this date
    const existingAvailability = await prisma.doctorAvailability.findUnique({
      where: {
        doctorUid_date: {
          doctorUid,
          date: new Date(date)
        }
      }
    });

    let availability;
    
    if (existingAvailability) {
      // Update existing availability
      availability = await prisma.doctorAvailability.update({
        where: { id: existingAvailability.id },
        data: {
          startTime,
          endTime,
          slotDuration,
          breakStartTime,
          breakEndTime,
          isAvailable: true,
          updatedAt: new Date()
        }
      });

      // Delete existing time slots
      await prisma.timeSlot.deleteMany({
        where: { availabilityId: availability.id }
      });
    } else {
      // Create new availability
      availability = await prisma.doctorAvailability.create({
        data: {
          doctorUid,
          date: new Date(date),
          startTime,
          endTime,
          slotDuration,
          breakStartTime,
          breakEndTime,
          isAvailable: true
        }
      });
    }

    // Generate time slots
    const timeSlots = generateTimeSlots(startTime, endTime, slotDuration, breakStartTime, breakEndTime);
    
    // Create time slots in database
    const createdSlots = await Promise.all(
      timeSlots.map(slot => 
        prisma.timeSlot.create({
          data: {
            availabilityId: availability.id,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isBooked: false
          }
        })
      )
    );

    res.status(201).json({
      availability,
      timeSlots: createdSlots,
      message: 'Availability set successfully'
    });

  } catch (error) {
    console.error('Error setting availability:', error);
    res.status(500).json({ error: 'Failed to set availability' });
  }
};

// Get doctor's availability for a specific date range
export const getDoctorAvailability = async (req: Request, res: Response) => {
  const { doctorUid } = req.params;
  const { date, startDate, endDate } = req.query;
  
  // Determine which doctor's availability to fetch:
  // 1. If doctorUid is provided in params, use it (for patients viewing doctor availability)
  // 2. If no doctorUid in params, use authenticated user's UID (for doctors viewing their own)
  let targetDoctorUid: string;
  
  if (doctorUid) {
    // Patient or admin viewing specific doctor's availability
    targetDoctorUid = doctorUid;
  } else {
    // Doctor viewing their own availability
    if (!req.user?.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    targetDoctorUid = req.user.uid;
  }

  try {
    let whereClause: any = {
      doctorUid: targetDoctorUid,
      isAvailable: true
    };

    // Handle date filtering
    if (date) {
      // Single date query
      whereClause.date = new Date(date as string);
    } else if (startDate && endDate) {
      // Date range query
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      
      whereClause.date = {
        gte: start,
        lte: end
      };
    }

    const availability = await prisma.doctorAvailability.findMany({
      where: whereClause,
      include: {
        timeSlots: {
          where: {
            isBooked: false
          },
          orderBy: {
            startTime: 'asc'
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    res.json(availability);
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
};

// Public endpoint for patients to view doctor availability (no auth required)
export const getPublicDoctorAvailability = async (req: Request, res: Response) => {
  const { doctorUid } = req.params;
  const { date, startDate, endDate } = req.query;
  
  if (!doctorUid) {
    return res.status(400).json({ error: 'Doctor UID is required' });
  }

  try {
    let whereClause: any = {
      doctorUid: doctorUid,
      isAvailable: true
    };

    // Handle date filtering
    if (date) {
      // Single date query with validation
      const queryDate = new Date(date as string);
      if (isNaN(queryDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      whereClause.date = queryDate;
    } else if (startDate && endDate) {
      // Date range query with validation
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      
      whereClause.date = {
        gte: start,
        lte: end
      };
    }

    const availability = await prisma.doctorAvailability.findMany({
      where: whereClause,
      include: {
        timeSlots: {
          where: {
            isBooked: false
          },
          orderBy: {
            startTime: 'asc'
          }
        },
        doctor: {
          select: {
            name: true,
            specialization: true,
            consultationFees: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    if (availability.length === 0) {
      return res.json({
        message: 'No availability found for this doctor',
        doctor: null,
        availability: []
      });
    }

    res.json({
      doctor: availability[0].doctor,
      availability: availability.map(slot => ({
        id: slot.id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        availableSlots: slot.timeSlots.length,
        timeSlots: slot.timeSlots
      }))
    });

  } catch (error) {
    console.error('Error fetching public doctor availability:', error);
    res.status(500).json({ error: 'Failed to fetch doctor availability' });
  }
};

// Get available time slots for a specific doctor and date (Public endpoint for patients)
export const getAvailableSlots = async (req: Request, res: Response) => {
  const { doctorUid } = req.params;
  const { date } = req.query;

  if (!doctorUid) {
    return res.status(400).json({ error: 'Doctor UID is required' });
  }

  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  try {
    const queryDate = new Date(date as string);
    if (isNaN(queryDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    const availability = await prisma.doctorAvailability.findUnique({
      where: {
        doctorUid_date: {
          doctorUid,
          date: queryDate
        }
      },
      include: {
        timeSlots: {
          where: {
            isBooked: false
          },
          orderBy: {
            startTime: 'asc'
          }
        },
        doctor: {
          select: {
            name: true,
            specialization: true,
            consultationFees: true
          }
        }
      }
    });

    if (!availability || !availability.isAvailable) {
      return res.status(404).json({ 
        message: 'No available slots found for this doctor on this date',
        doctor: null,
        date: queryDate,
        slots: [],
        consultationFees: null
      });
    }

    res.json({
      doctor: availability.doctor,
      date: availability.date,
      slots: availability.timeSlots,
      consultationFees: availability.doctor.consultationFees
    });

  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
};

// Update existing availability
export const updateAvailability = async (req: Request, res: Response) => {
  const doctorUid = req.user?.uid;
  const { id } = req.params;
  const { startTime, endTime, slotDuration, breakStartTime, breakEndTime, isAvailable } = req.body;

  if (!doctorUid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Verify ownership
    const availability = await prisma.doctorAvailability.findFirst({
      where: {
        id,
        doctorUid
      }
    });

    if (!availability) {
      return res.status(404).json({ error: 'Availability not found' });
    }

    // Update availability
    const updatedAvailability = await prisma.doctorAvailability.update({
      where: { id },
      data: {
        startTime,
        endTime,
        slotDuration,
        breakStartTime,
        breakEndTime,
        isAvailable,
        updatedAt: new Date()
      }
    });

    // If time or break time changed, regenerate slots
    if (startTime !== availability.startTime || 
        endTime !== availability.endTime || 
        slotDuration !== availability.slotDuration ||
        breakStartTime !== availability.breakStartTime ||
        breakEndTime !== availability.breakEndTime) {
      // Delete existing unbooked slots
      await prisma.timeSlot.deleteMany({
        where: {
          availabilityId: id,
          isBooked: false
        }
      });

      // Generate new time slots
      const timeSlots = generateTimeSlots(startTime, endTime, slotDuration, breakStartTime, breakEndTime);
      
      await Promise.all(
        timeSlots.map(slot => 
          prisma.timeSlot.create({
            data: {
              availabilityId: id,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isBooked: false
            }
          })
        )
      );
    }

    res.json({
      availability: updatedAvailability,
      message: 'Availability updated successfully'
    });

  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
};

// Delete availability
export const deleteAvailability = async (req: Request, res: Response) => {
  const doctorUid = req.user?.uid;
  const { id } = req.params;

  if (!doctorUid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Verify ownership and check for existing appointments
    const availability = await prisma.doctorAvailability.findFirst({
      where: {
        id,
        doctorUid
      },
      include: {
        timeSlots: {
          include: {
            appointment: true
          }
        }
      }
    });

    if (!availability) {
      return res.status(404).json({ error: 'Availability not found' });
    }

    // Check if any slots have appointments
    const hasAppointments = availability.timeSlots.some(slot => slot.appointment);
    
    if (hasAppointments) {
      return res.status(400).json({ 
        error: 'Cannot delete availability with existing appointments' 
      });
    }

    // Delete availability (cascades to time slots)
    await prisma.doctorAvailability.delete({
      where: { id }
    });

    res.json({ message: 'Availability deleted successfully' });

  } catch (error) {
    console.error('Error deleting availability:', error);
    res.status(500).json({ error: 'Failed to delete availability' });
  }
};

// Get doctor's weekly schedule
export const getWeeklySchedule = async (req: Request, res: Response) => {
  const doctorUid = req.user?.uid;
  const { startDate } = req.query;

  if (!doctorUid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const start = new Date(startDate as string);
    const end = new Date(start);
    end.setDate(start.getDate() + 6); // Get 7 days

    const availability = await prisma.doctorAvailability.findMany({
      where: {
        doctorUid,
        date: {
          gte: start,
          lte: end
        }
      },
      include: {
        timeSlots: {
          include: {
            appointment: {
              include: {
                patient: {
                  select: {
                    name: true,
                    phone: true
                  }
                }
              }
            }
          },
          orderBy: {
            startTime: 'asc'
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    res.json(availability);

  } catch (error) {
    console.error('Error fetching weekly schedule:', error);
    res.status(500).json({ error: 'Failed to fetch weekly schedule' });
  }
};
