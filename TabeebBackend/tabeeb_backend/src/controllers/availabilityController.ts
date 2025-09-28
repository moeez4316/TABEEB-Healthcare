import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { generateAvailableSlots, generateAllSlots } from '../utils/slotGenerator';

// Set doctor availability (simplified - no time slot generation)
export const setDoctorAvailability = async (req: Request, res: Response) => {
  try {
    const doctorUid = req.user!.uid;
    const { 
      date, 
      startTime, 
      endTime, 
      slotDuration = 30, 
      breakTimes,
      isAvailable = true 
    } = req.body;

    // Basic validation
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Date, start time, and end time are required' });
    }

    // Check if availability already exists for this date
    const existingAvailability = await prisma.doctorAvailability.findFirst({
      where: {
        doctorUid,
        date: new Date(date)
      }
    });

    if (existingAvailability) {
      return res.status(400).json({ error: 'Availability already exists for this date. Use update endpoint.' });
    }

    // Create availability record (no time slots generated - done on-demand)
    const availability = await prisma.doctorAvailability.create({
      data: {
        doctorUid,
        date: new Date(date),
        startTime,
        endTime,
        slotDuration,
        isAvailable
      },
      include: {
        doctor: {
          select: {
            name: true,
            specialization: true
          }
        }
      }
    });

    // Create multiple break times if provided
    if (breakTimes && Array.isArray(breakTimes) && breakTimes.length > 0) {
      await prisma.doctorBreakTime.createMany({
        data: breakTimes.map((breakTime: { startTime: string; endTime: string }) => ({
          availabilityId: availability.id,
          startTime: breakTime.startTime,
          endTime: breakTime.endTime
        }))
      });
    }

    // Fetch the created availability with break times
    const availabilityWithBreakTimes = await prisma.doctorAvailability.findUnique({
      where: { id: availability.id },
      include: {
        doctor: {
          select: {
            name: true,
            specialization: true
          }
        },
        breakTimes: true
      }
    });

    res.status(201).json({
      availability: availabilityWithBreakTimes,
      message: 'Availability set successfully with break times',
      note: 'Time slots are generated on-demand when requested'
    });

  } catch (error) {
    console.error('Error setting doctor availability:', error);
    res.status(500).json({ error: 'Failed to set availability' });
  }
};

// Get doctor availability
export const getDoctorAvailability = async (req: Request, res: Response) => {
  try {
    const { doctorUid } = req.params;
    const { date, startDate, endDate } = req.query;
    
    // Use provided doctorUid or authenticated user's UID
    const targetDoctorUid = doctorUid || req.user!.uid;

    let whereClause: any = {
      doctorUid: targetDoctorUid,
      isAvailable: true
    };

    // Date filtering
    if (date) {
      const queryDate = new Date(date as string);
      if (isNaN(queryDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      whereClause.date = queryDate;
    } else if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      whereClause.date = {
        gte: start,
        lte: end
      };
    } else {
      // If no specific date range is provided, only return today and future dates
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of today
      whereClause.date = {
        gte: today
      };
    }

    const availability = await prisma.doctorAvailability.findMany({
      where: whereClause,
      include: {
        doctor: {
          select: {
            name: true,
            specialization: true
          }
        },
        breakTimes: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    res.json(availability);

  } catch (error) {
    console.error('Error fetching doctor availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
};

// Get available slots (using on-demand slot generation)
export const getAvailableSlots = async (req: Request, res: Response) => {
  try {
    const { doctorUid } = req.params;
    const { date } = req.query;

    if (!doctorUid) {
      return res.status(400).json({ error: 'Doctor UID is required' });
    }

    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    const queryDate = new Date(date as string);
    if (isNaN(queryDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Get doctor availability for the specified date
    const availability = await prisma.doctorAvailability.findFirst({
      where: {
        doctorUid,
        date: queryDate,
        isAvailable: true
      },
      include: {
        doctor: {
          select: {
            name: true,
            specialization: true
          }
        },
        breakTimes: true
      }
    }) as any; // Will be fixed once TypeScript cache updates

    if (!availability) {
      return res.json({
        availableSlots: [],
        message: 'No availability found for this date',
        date: queryDate,
        doctor: null,
        statistics: {
          totalSlots: 0,
          bookedSlots: 0,
          availableSlots: 0,
          utilization: '0%'
        }
      });
    }

    // Get existing appointments for this date to check which slots are booked
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorUid,
        appointmentDate: queryDate,
        status: {
          in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
        }
      },
      select: {
        startTime: true,
        endTime: true
      }
    });

    // Use our slot generator utility
    const availabilityData = {
      startTime: availability.startTime,
      endTime: availability.endTime,
      slotDuration: availability.slotDuration,
      breakTimes: availability.breakTimes || []
    };

    const allSlots = generateAllSlots(availabilityData, existingAppointments);
    const availableSlots = generateAvailableSlots(availabilityData, existingAppointments);

    // Filter slots for today (no past slots)
    const isToday = queryDate.toDateString() === new Date().toDateString();
    let filteredSlots = availableSlots;
    
    if (isToday) {
      const now = new Date();
      const currentTimeMinutes = now.getHours() * 60 + now.getMinutes() + 15; // 15-minute buffer
      
      filteredSlots = availableSlots.filter(slot => {
        const [hour, minute] = slot.startTime.split(':').map(Number);
        const slotTimeMinutes = hour * 60 + minute;
        return slotTimeMinutes >= currentTimeMinutes;
      });
    }

    // Calculate statistics
    const totalSlots = allSlots.length;
    const bookedSlots = allSlots.filter(slot => !slot.isAvailable).length;
    const availableSlotsCount = filteredSlots.length;
    const utilization = totalSlots > 0 ? ((bookedSlots / totalSlots) * 100).toFixed(1) : '0';

    // Format break times for response
    const breakTimeStrings = availability.breakTimes?.map((bt: any) => `${bt.startTime}-${bt.endTime}`) || [];

    res.json({
      date: queryDate,
      doctor: availability.doctor,
      schedule: {
        startTime: availability.startTime,
        endTime: availability.endTime,
        slotDuration: availability.slotDuration,
        breakTimes: breakTimeStrings
      },
      availableSlots: filteredSlots,
      allSlots: allSlots,
      statistics: {
        totalSlots,
        bookedSlots,
        availableSlots: availableSlotsCount,
        utilization: `${utilization}%`
      },
      message: 'Slots generated successfully on-demand'
    });

  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
};

// Update availability
export const updateAvailability = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorUid = req.user!.uid;
    const { date, startTime, endTime, slotDuration, breakTimes, isAvailable } = req.body;

    // Find existing availability
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
        ...(date && { date: new Date(date) }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(slotDuration && { slotDuration }),
        ...(isAvailable !== undefined && { isAvailable })
      }
    });

    // Update break times if provided
    if (breakTimes !== undefined) {
      // Delete existing break times
      await (prisma as any).doctorBreakTime.deleteMany({
        where: {
          availabilityId: id
        }
      });

      // Create new break times if provided
      if (Array.isArray(breakTimes) && breakTimes.length > 0) {
        await (prisma as any).doctorBreakTime.createMany({
          data: breakTimes.map((breakTime: { startTime: string; endTime: string }) => ({
            availabilityId: id,
            startTime: breakTime.startTime,
            endTime: breakTime.endTime
          }))
        });
      }
    }

    // Fetch updated availability with break times
    const finalAvailability = await prisma.doctorAvailability.findUnique({
      where: { id },
      include: {
        doctor: {
          select: {
            name: true,
            specialization: true
          }
        },
        breakTimes: true
      }
    }) as any; // Temporary type assertion

    res.json({
      availability: finalAvailability,
      message: 'Availability updated successfully with break times',
      note: 'Time slots are generated on-demand when requested'
    });

  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
};

// Delete availability (updated to allow deletion with existing appointments)
export const deleteAvailability = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorUid = req.user!.uid;

    // Find availability
    const availability = await prisma.doctorAvailability.findFirst({
      where: {
        id,
        doctorUid
      }
    });

    if (!availability) {
      return res.status(404).json({ error: 'Availability not found' });
    }

    // Check for existing appointments (for informational purposes)
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorUid,
        appointmentDate: availability.date,
        status: {
          notIn: ['CANCELLED', 'NO_SHOW']
        }
      }
    });

    // Delete availability (allowing deletion even with booked appointments)
    await prisma.doctorAvailability.delete({
      where: { id }
    });

    let message = 'Availability deleted successfully';
    let warning = null;

    if (existingAppointments.length > 0) {
      warning = `${existingAppointments.length} existing appointment(s) will remain active. New patients cannot book for this date.`;
      message = 'Availability deleted successfully. Existing appointments are preserved.';
    }

    res.json({ 
      message,
      warning,
      existingAppointmentsCount: existingAppointments.length,
      note: 'Existing appointments remain active and accessible to both doctor and patients'
    });

  } catch (error) {
    console.error('Error deleting availability:', error);
    res.status(500).json({ error: 'Failed to delete availability' });
  }
};

// Get weekly schedule (simplified)
export const getWeeklySchedule = async (req: Request, res: Response) => {
  try {
    const { doctorUid } = req.params;
    const { week } = req.query; // Start of week date

    const targetDoctorUid = doctorUid || req.user!.uid;
    const weekStart = new Date(week as string);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const availability = await prisma.doctorAvailability.findMany({
      where: {
        doctorUid: targetDoctorUid,
        date: {
          gte: weekStart,
          lte: weekEnd
        },
        isAvailable: true
      },
      include: {
        doctor: {
          select: {
            name: true,
            specialization: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    res.json({
      week: {
        start: weekStart,
        end: weekEnd
      },
      schedule: availability,
      message: 'Weekly schedule (simplified version)'
    });

  } catch (error) {
    console.error('Error fetching weekly schedule:', error);
    res.status(500).json({ error: 'Failed to fetch weekly schedule' });
  }
};
