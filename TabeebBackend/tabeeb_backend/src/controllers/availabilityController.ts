import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// Set doctor availability (simplified - no time slot generation)
export const setDoctorAvailability = async (req: Request, res: Response) => {
  try {
    const doctorUid = req.user!.uid;
    const { date, startTime, endTime, slotDuration = 30, breakStartTime, breakEndTime, isAvailable = true } = req.body;

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
        breakStartTime: breakStartTime || null,
        breakEndTime: breakEndTime || null,
        isAvailable
      },
      include: {
        doctor: {
          select: {
            name: true,
            specialization: true,
            consultationFees: true
          }
        }
      }
    });

    res.status(201).json({
      availability,
      message: 'Availability set successfully',
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
            specialization: true,
            consultationFees: true
          }
        }
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

// Get available slots (simplified version)
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
            specialization: true,
            consultationFees: true
          }
        }
      }
    });

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

    // Generate time slots on-demand
    const slots = [];
    const [startHour, startMinute] = availability.startTime.split(':').map(Number);
    const [endHour, endMinute] = availability.endTime.split(':').map(Number);
    
    let currentTime = startHour * 60 + startMinute; // Convert to minutes
    const endTime = endHour * 60 + endMinute;
    
    // Check if the appointment date is today and filter past slots
    const isToday = queryDate.toDateString() === new Date().toDateString();
    let minCurrentTime = currentTime;
    
    if (isToday) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      
      // For today, start from the next available slot that hasn't passed
      // Add buffer of 15 minutes to allow for booking time
      minCurrentTime = Math.max(currentTime, currentTimeInMinutes + 15);
      
      // Round up to the next slot boundary
      const remainder = minCurrentTime % availability.slotDuration;
      if (remainder !== 0) {
        minCurrentTime += availability.slotDuration - remainder;
      }
    }
    
    // Break time handling
    let breakStart = null;
    let breakEnd = null;
    if (availability.breakStartTime && availability.breakEndTime) {
      const [bsHour, bsMinute] = availability.breakStartTime.split(':').map(Number);
      const [beHour, beMinute] = availability.breakEndTime.split(':').map(Number);
      breakStart = bsHour * 60 + bsMinute;
      breakEnd = beHour * 60 + beMinute;
    }

    // Start from the calculated minimum time (current time for today, start time for future dates)
    currentTime = Math.max(currentTime, minCurrentTime);

    while (currentTime + availability.slotDuration <= endTime) {
      const slotEndTime = currentTime + availability.slotDuration;
      
      // Skip if slot is in break time
      if (breakStart && breakEnd && 
          ((currentTime >= breakStart && currentTime < breakEnd) ||
           (slotEndTime > breakStart && slotEndTime <= breakEnd))) {
        currentTime += availability.slotDuration;
        continue;
      }

      // Convert back to time format
      const hour = Math.floor(currentTime / 60);
      const minute = currentTime % 60;
      const slotStartTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      const endHourSlot = Math.floor(slotEndTime / 60);
      const endMinuteSlot = slotEndTime % 60;
      const slotEndTimeStr = `${endHourSlot.toString().padStart(2, '0')}:${endMinuteSlot.toString().padStart(2, '0')}`;

      // Check if slot is booked
      const isBooked = existingAppointments.some(apt => 
        apt.startTime === slotStartTime
      );

      slots.push({
        startTime: slotStartTime,
        endTime: slotEndTimeStr,
        duration: availability.slotDuration,
        isAvailable: !isBooked,
        isBooked: isBooked
      });

      currentTime += availability.slotDuration;
    }

    // Calculate statistics
    const totalSlots = slots.length;
    const bookedSlots = slots.filter(slot => slot.isBooked).length;
    const availableSlots = totalSlots - bookedSlots;
    const utilization = totalSlots > 0 ? ((bookedSlots / totalSlots) * 100).toFixed(1) : '0';

    res.json({
      date: queryDate,
      doctor: availability.doctor,
      schedule: {
        startTime: availability.startTime,
        endTime: availability.endTime,
        slotDuration: availability.slotDuration,
        breakTime: availability.breakStartTime && availability.breakEndTime 
          ? `${availability.breakStartTime}-${availability.breakEndTime}` 
          : null
      },
      availableSlots: slots.filter(slot => slot.isAvailable),
      allSlots: slots,
      statistics: {
        totalSlots,
        bookedSlots,
        availableSlots,
        utilization: `${utilization}%`
      },
      message: 'Slots generated successfully on-demand'
    });

  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
};

// Update availability (simplified)
export const updateAvailability = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorUid = req.user!.uid;
    const { date, startTime, endTime, slotDuration, breakStartTime, breakEndTime, isAvailable } = req.body;

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
        ...(breakStartTime !== undefined && { breakStartTime: breakStartTime || null }),
        ...(breakEndTime !== undefined && { breakEndTime: breakEndTime || null }),
        ...(isAvailable !== undefined && { isAvailable })
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

    res.json({
      availability: updatedAvailability,
      message: 'Availability updated successfully',
      note: 'Time slots are generated on-demand when requested'
    });

  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
};

// Delete availability
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

    // Check for booked appointments
    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorUid,
        appointmentDate: availability.date,
        status: {
          notIn: ['CANCELLED', 'NO_SHOW']
        }
      }
    });

    if (bookedAppointments.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete availability with booked appointments',
        bookedAppointments: bookedAppointments.length
      });
    }

    // Delete availability
    await prisma.doctorAvailability.delete({
      where: { id }
    });

    res.json({ message: 'Availability deleted successfully' });

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
