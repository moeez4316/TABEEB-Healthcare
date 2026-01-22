import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { formatPhoneForDisplay } from '../utils/phoneUtils';

/**
 * Get public doctor profile with all related data
 * This endpoint is for patients and public users to view doctor profiles
 */
export const getPublicDoctorProfile = async (req: Request, res: Response) => {
  try {
    const { doctorUid } = req.params;

    if (!doctorUid) {
      return res.status(400).json({ error: 'Doctor UID is required' });
    }

    // Fetch doctor with verification
    const doctor = await prisma.doctor.findUnique({
      where: { uid: doctorUid },
      include: {
        verification: {
          select: {
            status: true,
            isVerified: true,
            pmdcNumber: true,
            graduationYear: true,
            degreeInstitution: true,
          }
        }
      }
    });

    if (!doctor || !doctor.isActive) {
      return res.status(404).json({ error: 'Doctor not found or inactive' });
    }

    // Only show approved doctors publicly
    if (doctor.verification?.status !== 'approved' || !doctor.verification?.isVerified) {
      return res.status(404).json({ error: 'Doctor profile not available' });
    }

    // Get appointment statistics
    const [totalAppointments, completedAppointments] = await Promise.all([
      prisma.appointment.count({
        where: {
          doctorUid: doctorUid,
          status: { in: ['COMPLETED', 'CONFIRMED', 'IN_PROGRESS'] }
        }
      }),
      prisma.appointment.count({
        where: {
          doctorUid: doctorUid,
          status: 'COMPLETED'
        }
      })
    ]);

    // Get unique patients count (completed appointments only)
    const uniquePatients = await prisma.appointment.findMany({
      where: {
        doctorUid: doctorUid,
        status: 'COMPLETED'
      },
      distinct: ['patientUid'],
      select: {
        patientUid: true
      }
    });

    // Get recent published blogs (limit 6)
    const recentBlogs = await prisma.blog.findMany({
      where: {
        doctorUid: doctorUid,
        status: 'PUBLISHED'
      },
      take: 6,
      orderBy: {
        publishedAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImageUrl: true,
        readTime: true,
        viewCount: true,
        publishedAt: true,
        tags: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    // Get review statistics
    const reviews = await prisma.review.findMany({
      where: {
        appointment: {
          doctorUid: doctorUid
        },
        isComplaint: false
      },
      select: {
        rating: true
      }
    });

    // Calculate rating distribution
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };

    // Get recent public reviews (limit 10)
    const recentReviews = await prisma.review.findMany({
      where: {
        appointment: {
          doctorUid: doctorUid
        },
        isComplaint: false
      },
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        appointment: {
          select: {
            patient: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    // Format reviews for public display
    const formattedReviews = recentReviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      patientName: `${review.appointment.patient.firstName} ${review.appointment.patient.lastName.charAt(0)}.` // Anonymize last name
    }));

    // Build the comprehensive profile response
    const profileResponse = {
      // Basic Information
      uid: doctor.uid,
      name: doctor.name,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      profileImageUrl: doctor.profileImageUrl,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experience: doctor.experience,
      
      // Contact & Location (limited public info)
      email: doctor.email,
      phone: doctor.phone ? formatPhoneForDisplay(doctor.phone) : null,
      addressCity: doctor.addressCity,
      addressProvince: doctor.addressProvince,
      
      // Professional Details
      hourlyConsultationRate: doctor.hourlyConsultationRate,
      language: doctor.language,
      
      // Verification
      verification: {
        isVerified: doctor.verification?.isVerified || false,
        status: doctor.verification?.status || 'not-submitted',
        pmdcNumber: doctor.verification?.pmdcNumber || null,
        graduationYear: doctor.verification?.graduationYear || null,
        degreeInstitution: doctor.verification?.degreeInstitution || null,
      },
      
      // Statistics
      stats: {
        totalAppointments,
        completedAppointments,
        totalPatients: uniquePatients.length,
        averageRating: doctor.averageRating || 0,
        totalReviews: doctor.totalReviews || 0,
        ratingDistribution
      },
      
      // Recent Content
      recentBlogs,
      recentReviews: formattedReviews,
      totalPublishedBlogs: await prisma.blog.count({
        where: {
          doctorUid: doctorUid,
          status: 'PUBLISHED'
        }
      })
    };

    res.json(profileResponse);
  } catch (error) {
    console.error('Error fetching public doctor profile:', error);
    res.status(500).json({ error: 'Failed to fetch doctor profile' });
  }
};

/**
 * Get doctor's availability summary (next 7 days)
 */
export const getDoctorAvailabilitySummary = async (req: Request, res: Response) => {
  try {
    const { doctorUid } = req.params;

    if (!doctorUid) {
      return res.status(400).json({ error: 'Doctor UID is required' });
    }

    // Get next 7 days dates
    const today = new Date();
    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      return date;
    });

    const availabilitySummary = await Promise.all(
      next7Days.map(async (date) => {
        const dateStr = date.toISOString().split('T')[0];
        
        const availability = await prisma.doctorAvailability.findFirst({
          where: {
            doctorUid: doctorUid,
            date: new Date(dateStr),
            isAvailable: true
          },
          include: {
            breakTimes: true
          }
        });

        if (!availability) {
          return {
            date: dateStr,
            dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
            isAvailable: false,
            totalSlots: 0,
            availableSlots: 0
          };
        }

        // Calculate total slots
        const startTime = availability.startTime;
        const endTime = availability.endTime;
        const slotDuration = availability.slotDuration;

        // Parse time strings to get total minutes
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        const totalMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
        const totalSlots = Math.floor(totalMinutes / slotDuration);

        // Get booked appointments for this date
        const bookedAppointments = await prisma.appointment.count({
          where: {
            doctorUid: doctorUid,
            appointmentDate: new Date(dateStr),
            status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] }
          }
        });

        return {
          date: dateStr,
          dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
          isAvailable: true,
          totalSlots,
          availableSlots: Math.max(0, totalSlots - bookedAppointments),
          startTime: availability.startTime,
          endTime: availability.endTime
        };
      })
    );

    res.json({
      doctorUid,
      availabilitySummary
    });
  } catch (error) {
    console.error('Error fetching doctor availability summary:', error);
    res.status(500).json({ error: 'Failed to fetch availability summary' });
  }
};
