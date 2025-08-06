import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// Patient books an appointment
export const bookAppointment = async (req: Request, res: Response) => {
  const patientUid = req.user?.uid;
  const { doctorUid, timeSlotId, appointmentDate, patientNotes } = req.body;

  if (!patientUid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Verify the time slot is available
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: {
        availability: {
          include: {
            doctor: {
              select: {
                name: true,
                specialization: true,
                consultationFees: true
              }
            }
          }
        }
      }
    });

    if (!timeSlot) {
      return res.status(404).json({ error: 'Time slot not found' });
    }

    if (timeSlot.isBooked) {
      return res.status(400).json({ error: 'Time slot is already booked' });
    }

    if (timeSlot.availability.doctorUid !== doctorUid) {
      return res.status(400).json({ error: 'Time slot does not belong to the specified doctor' });
    }

    // Check if appointment date matches the availability date
    const slotDate = new Date(timeSlot.availability.date);
    const reqDate = new Date(appointmentDate);
    
    if (slotDate.toDateString() !== reqDate.toDateString()) {
      return res.status(400).json({ error: 'Appointment date does not match time slot date' });
    }

    // Create appointment and mark slot as booked in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create appointment
      const appointment = await tx.appointment.create({
        data: {
          doctorUid,
          patientUid,
          timeSlotId,
          appointmentDate: new Date(appointmentDate),
          appointmentTime: timeSlot.startTime,
          duration: timeSlot.availability.slotDuration,
          patientNotes,
          consultationFees: timeSlot.availability.doctor.consultationFees,
          status: 'PENDING'
        },
        include: {
          doctor: {
            select: {
              name: true,
              specialization: true,
              phone: true,
              email: true
            }
          },
          patient: {
            select: {
              name: true,
              phone: true,
              email: true
            }
          },
          timeSlot: true
        }
      });

      // Mark time slot as booked
      await tx.timeSlot.update({
        where: { id: timeSlotId },
        data: { isBooked: true }
      });

      return appointment;
    });

    res.status(201).json({
      appointment: result,
      message: 'Appointment booked successfully'
    });

  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
};

// Get appointments for a doctor
export const getDoctorAppointments = async (req: Request, res: Response) => {
  const doctorUid = req.user?.uid;
  const { status, date, page = 1, limit = 10 } = req.query;

  if (!doctorUid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const where: any = { doctorUid };

    // Filter by status if provided
    if (status) {
      where.status = status;
    }

    // Filter by date if provided
    if (date) {
      const filterDate = new Date(date as string);
      where.appointmentDate = filterDate;
    }

    // Get total count for pagination
    const totalCount = await prisma.appointment.count({ where });

    // Get appointments with pagination
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            name: true,
            phone: true,
            email: true,
            gender: true,
            dob: true
          }
        },
        timeSlot: true
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { appointmentTime: 'asc' }
      ],
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    res.json({
      appointments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / Number(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Get appointments for a patient
export const getPatientAppointments = async (req: Request, res: Response) => {
  const patientUid = req.user?.uid;
  const { status, upcoming } = req.query;

  if (!patientUid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const where: any = { patientUid };

    // Filter by status if provided
    if (status) {
      where.status = status;
    }

    // Filter upcoming appointments
    if (upcoming === 'true') {
      where.appointmentDate = {
        gte: new Date()
      };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        doctor: {
          select: {
            name: true,
            specialization: true,
            phone: true,
            email: true,
            consultationFees: true
          }
        },
        timeSlot: true
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { appointmentTime: 'asc' }
      ]
    });

    res.json(appointments);

  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// Update appointment status (Doctor only)
export const updateAppointmentStatus = async (req: Request, res: Response) => {
  const doctorUid = req.user?.uid;
  const { id } = req.params;
  const { status, doctorNotes, cancelReason } = req.body;

  if (!doctorUid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Verify appointment belongs to the doctor
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        doctorUid
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Update appointment
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (doctorNotes) {
      updateData.doctorNotes = doctorNotes;
    }

    if (cancelReason) {
      updateData.cancelReason = cancelReason;
    }

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const updatedAppointment = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id },
        data: updateData,
        include: {
          patient: {
            select: {
              name: true,
              phone: true,
              email: true
            }
          },
          timeSlot: true
        }
      });

      // If cancelled, free up the time slot
      if (status === 'CANCELLED') {
        await tx.timeSlot.update({
          where: { id: appointment.timeSlotId },
          data: { isBooked: false }
        });
      }

      return updated;
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

// Cancel appointment (Patient or Doctor)
export const cancelAppointment = async (req: Request, res: Response) => {
  const userUid = req.user?.uid;
  const { id } = req.params;
  const { cancelReason } = req.body;

  if (!userUid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Find appointment and verify ownership
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        OR: [
          { doctorUid: userUid },
          { patientUid: userUid }
        ]
      }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Appointment is already cancelled' });
    }

    if (appointment.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot cancel a completed appointment' });
    }

    // Cancel appointment and free up the time slot
    const cancelledAppointment = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelReason,
          updatedAt: new Date()
        },
        include: {
          doctor: {
            select: {
              name: true,
              specialization: true
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

      // Free up the time slot
      await tx.timeSlot.update({
        where: { id: appointment.timeSlotId },
        data: { isBooked: false }
      });

      return updated;
    });

    res.json({
      appointment: cancelledAppointment,
      message: 'Appointment cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
};

// Get appointment details
export const getAppointmentDetails = async (req: Request, res: Response) => {
  const userUid = req.user?.uid;
  const { id } = req.params;

  if (!userUid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        OR: [
          { doctorUid: userUid },
          { patientUid: userUid }
        ]
      },
      include: {
        doctor: {
          select: {
            name: true,
            specialization: true,
            qualification: true,
            phone: true,
            email: true,
            consultationFees: true
          }
        },
        patient: {
          select: {
            name: true,
            phone: true,
            email: true,
            gender: true,
            dob: true,
            medicalHistory: true
          }
        },
        timeSlot: {
          include: {
            availability: true
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

// Get appointment statistics for dashboard
export const getAppointmentStats = async (req: Request, res: Response) => {
  const userUid = req.user?.uid;
  const userRole = req.user?.role;

  if (!userUid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());

    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

    const whereClause = userRole === 'doctor' 
      ? { doctorUid: userUid }
      : { patientUid: userUid };

    const [
      totalAppointments,
      todayAppointments,
      upcomingAppointments,
      pendingAppointments,
      completedAppointments,
      thisWeekAppointments
    ] = await Promise.all([
      prisma.appointment.count({ where: whereClause }),
      
      prisma.appointment.count({
        where: {
          ...whereClause,
          appointmentDate: today
        }
      }),
      
      prisma.appointment.count({
        where: {
          ...whereClause,
          appointmentDate: { gte: today },
          status: { not: 'CANCELLED' }
        }
      }),
      
      prisma.appointment.count({
        where: {
          ...whereClause,
          status: 'PENDING'
        }
      }),
      
      prisma.appointment.count({
        where: {
          ...whereClause,
          status: 'COMPLETED'
        }
      }),
      
      prisma.appointment.count({
        where: {
          ...whereClause,
          appointmentDate: {
            gte: thisWeekStart,
            lte: thisWeekEnd
          }
        }
      })
    ]);

    res.json({
      total: totalAppointments,
      today: todayAppointments,
      upcoming: upcomingAppointments,
      pending: pendingAppointments,
      completed: completedAppointments,
      thisWeek: thisWeekAppointments
    });

  } catch (error) {
    console.error('Error fetching appointment stats:', error);
    res.status(500).json({ error: 'Failed to fetch appointment statistics' });
  }
};
