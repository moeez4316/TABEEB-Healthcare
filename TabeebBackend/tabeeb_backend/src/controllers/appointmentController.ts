import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { generateAvailableSlots, isSlotAvailable, calculateEndTime, getSlotsStatistics } from '../utils/slotGenerator';

// Book appointment (updated to work without TimeSlot)
export const bookAppointment = async (req: Request, res: Response) => {
  try {
    const patientUid = req.user!.uid;
    const { doctorUid, appointmentDate, startTime, patientNotes } = req.body;

    // Validate required fields
    if (!doctorUid || !appointmentDate || !startTime) {
      return res.status(400).json({ error: 'Doctor UID, appointment date, and start time are required' });
    }

    // Check if appointment date is in the future
    const appointmentDateObj = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (appointmentDateObj < today) {
      return res.status(400).json({ error: 'Cannot book appointments in the past' });
    }

    // Check if appointment is too far in the future (3 months)
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    
    if (appointmentDateObj > threeMonthsFromNow) {
      return res.status(400).json({ error: 'Cannot book appointments more than 3 months in advance' });
    }

    // Get doctor availability for the date
    const availability = await prisma.doctorAvailability.findFirst({
      where: {
        doctorUid,
        date: appointmentDateObj,
        isAvailable: true
      }
    });

    if (!availability) {
      return res.status(400).json({ error: 'Doctor is not available on this date' });
    }

    // Get existing appointments to check slot availability
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorUid,
        appointmentDate: appointmentDateObj,
        status: {
          notIn: ['CANCELLED', 'NO_SHOW']
        }
      },
      select: {
        startTime: true,
        endTime: true
      }
    });

    // Check if the requested slot is available
    if (!isSlotAvailable(startTime, availability, existingAppointments)) {
      const availableSlots = generateAvailableSlots(availability, existingAppointments);
      return res.status(400).json({ 
        error: 'Requested time slot is not available',
        availableSlots: availableSlots.map(slot => slot.startTime)
      });
    }

    // Calculate end time
    const endTime = calculateEndTime(startTime, availability.slotDuration);

    // Get doctor and patient details
    const [doctor, patient] = await Promise.all([
      prisma.doctor.findUnique({
        where: { uid: doctorUid },
        select: {
          name: true,
          specialization: true,
          consultationFees: true
        }
      }),
      prisma.patient.findUnique({
        where: { uid: patientUid },
        select: {
          name: true,
          phone: true
        }
      })
    ]);

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        doctorUid,
        patientUid,
        appointmentDate: appointmentDateObj,
        startTime,
        endTime,
        duration: availability.slotDuration,
        status: 'PENDING',
        patientNotes,
        consultationFees: doctor.consultationFees
      },
      include: {
        doctor: {
          select: {
            name: true,
            specialization: true,
            consultationFees: true
          }
        },
        patient: {
          select: {
            name: true,
            phone: true
          }
        }
      }
    });

    res.status(201).json({
      appointment,
      message: 'Appointment booked successfully'
    });

  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
};

// Get doctor appointments (updated)
export const getDoctorAppointments = async (req: Request, res: Response) => {
  try {
    const doctorUid = req.user!.uid;
    const { status, date, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100); // Max 100 items per page
    const skip = (pageNum - 1) * limitNum;

    let whereClause: any = { doctorUid };

    if (status) {
      whereClause.status = status;
    }

    if (date) {
      whereClause.appointmentDate = new Date(date as string);
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: whereClause,
        include: {
          patient: {
            select: {
              name: true,
              phone: true,
              dob: true,
              gender: true
            }
          }
        },
        orderBy: [
          { appointmentDate: 'asc' },
          { startTime: 'asc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.appointment.count({ where: whereClause })
    ]);

    res.json({
      appointments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Get patient appointments (updated)
export const getPatientAppointments = async (req: Request, res: Response) => {
  try {
    const patientUid = req.user!.uid;
    const { status, upcoming } = req.query;

    let whereClause: any = { patientUid };

    if (status) {
      whereClause.status = status;
    }

    if (upcoming === 'true') {
      whereClause.appointmentDate = {
        gte: new Date()
      };
    }

    const appointments = await prisma.appointment.findMany({
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
      orderBy: [
        { appointmentDate: 'asc' },
        { startTime: 'asc' }
      ]
    });

    res.json(appointments);

  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Update appointment status
export const updateAppointmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doctorUid = req.user!.uid;
    const { status, doctorNotes, cancelReason } = req.body;

    // Validate status
    const validStatuses = ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Find appointment
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        doctorUid
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Validate status transition
    if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot update completed or cancelled appointment' });
    }

    if (status === 'CANCELLED' && !cancelReason) {
      return res.status(400).json({ error: 'Cancel reason is required when cancelling appointment' });
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status,
        doctorNotes,
        cancelReason,
        ...(status === 'COMPLETED' && { completedAt: new Date() })
      },
      include: {
        patient: {
          select: {
            name: true,
            phone: true
          }
        },
        doctor: {
          select: {
            name: true,
            specialization: true
          }
        }
      }
    });

    res.json({
      appointment: updatedAppointment,
      message: `Appointment ${status.toLowerCase()} successfully`
    });

  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ error: 'Failed to update appointment status' });
  }
};

// Cancel appointment
export const cancelAppointment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userUid = req.user!.uid;
    const { cancelReason } = req.body;

    if (!cancelReason) {
      return res.status(400).json({ error: 'Cancel reason is required' });
    }

    // Find appointment (can be cancelled by patient or doctor)
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        OR: [
          { patientUid: userUid },
          { doctorUid: userUid }
        ]
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot cancel completed or already cancelled appointment' });
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelReason
      },
      include: {
        patient: {
          select: {
            name: true
          }
        },
        doctor: {
          select: {
            name: true
          }
        }
      }
    });

    res.json({
      appointment: updatedAppointment,
      message: 'Appointment cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
};

// Get appointment details
export const getAppointmentDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userUid = req.user!.uid;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        OR: [
          { patientUid: userUid },
          { doctorUid: userUid }
        ]
      },
      include: {
        doctor: {
          select: {
            name: true,
            specialization: true,
            consultationFees: true
          }
        },
        patient: {
          select: {
            name: true,
            phone: true,
            dob: true,
            gender: true
          }
        }
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(appointment);

  } catch (error) {
    console.error('Error fetching appointment details:', error);
    res.status(500).json({ error: 'Failed to fetch appointment details' });
  }
};

// Get appointment statistics
export const getAppointmentStats = async (req: Request, res: Response) => {
  try {
    const doctorUid = req.user!.uid;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());

    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

    const [total, todayCount, upcoming, pending, completed, thisWeek] = await Promise.all([
      prisma.appointment.count({
        where: { doctorUid }
      }),
      prisma.appointment.count({
        where: {
          doctorUid,
          appointmentDate: today,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] }
        }
      }),
      prisma.appointment.count({
        where: {
          doctorUid,
          appointmentDate: { gte: today },
          status: { notIn: ['CANCELLED', 'NO_SHOW', 'COMPLETED'] }
        }
      }),
      prisma.appointment.count({
        where: {
          doctorUid,
          status: 'PENDING'
        }
      }),
      prisma.appointment.count({
        where: {
          doctorUid,
          status: 'COMPLETED'
        }
      }),
      prisma.appointment.count({
        where: {
          doctorUid,
          appointmentDate: {
            gte: thisWeekStart,
            lte: thisWeekEnd
          },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] }
        }
      })
    ]);

    res.json({
      total,
      today: todayCount,
      upcoming,
      pending,
      completed,
      thisWeek
    });

  } catch (error) {
    console.error('Error fetching appointment statistics:', error);
    res.status(500).json({ error: 'Failed to fetch appointment statistics' });
  }
};
