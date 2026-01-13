import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

interface CreateReviewParams {
  appointmentId: string;
  rating: number;
  comment?: string;
  isComplaint: boolean;
}

interface UpdateDoctorRatingResult {
  averageRating: number;
  totalReviews: number;
}

/**
 * Create a new review for a completed appointment
 */
export const createReview = async (params: CreateReviewParams) => {
  const { appointmentId, rating, comment, isComplaint } = params;

  // Validate rating range
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  // Validate complaint requires comment
  if (isComplaint && !comment) {
    throw new Error('Comment is required for complaints');
  }

  // Get appointment with doctor and patient info
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      doctor: true,
      patient: true
    }
  });

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // Check if appointment is completed
  if (appointment.status !== 'COMPLETED') {
    throw new Error('Can only review completed appointments');
  }

  // Check if review already exists
  const existingReview = await prisma.review.findUnique({
    where: { appointmentId }
  });

  if (existingReview) {
    throw new Error('Review already exists for this appointment');
  }

  // Create the review
  const review = await prisma.review.create({
    data: {
      appointmentId,
      rating,
      comment,
      isComplaint
    },
    include: {
      appointment: {
        include: {
          doctor: {
            select: {
              name: true,
              specialization: true
            }
          },
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

  // Update doctor's rating if it's not a complaint
  if (!isComplaint) {
    await updateDoctorRating(appointment.doctorUid);
  }

  return review;
};

/**
 * Calculate and update doctor's average rating and total reviews
 * Only counts non-complaint reviews
 */
export const updateDoctorRating = async (doctorUid: string): Promise<UpdateDoctorRatingResult> => {
  // Get all non-complaint reviews for this doctor
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

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
    : 0;

  // Update doctor record
  await prisma.doctor.update({
    where: { uid: doctorUid },
    data: {
      averageRating: parseFloat(averageRating.toFixed(2)), // Round to 2 decimal places
      totalReviews
    }
  });

  return {
    averageRating: parseFloat(averageRating.toFixed(2)),
    totalReviews
  };
};

/**
 * Get reviews for a specific doctor
 */
export const getDoctorReviews = async (
  doctorUid: string,
  page: number = 1,
  limit: number = 10,
  filterComplaints?: boolean
) => {
  const skip = (page - 1) * limit;

  const where: Prisma.ReviewWhereInput = {
    appointment: {
      doctorUid: doctorUid
    },
    ...(filterComplaints !== undefined && { isComplaint: filterComplaints })
  };

  const [reviews, totalCount] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        appointment: {
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.review.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    reviews,
    pagination: {
      currentPage: page,
      totalPages,
      totalReviews: totalCount,
      hasMore: page < totalPages,
      limit
    }
  };
};

/**
 * Get doctor's rating statistics
 */
export const getDoctorRating = async (doctorUid: string) => {
  const doctor = await prisma.doctor.findUnique({
    where: { uid: doctorUid },
    select: {
      averageRating: true,
      totalReviews: true
    }
  });

  if (!doctor) {
    throw new Error('Doctor not found');
  }

  return {
    averageRating: doctor.averageRating || 0,
    totalReviews: doctor.totalReviews || 0
  };
};

/**
 * Get all complaint reviews (for admin)
 */
export const getComplaintReviews = async (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;

  const where: Prisma.ReviewWhereInput = {
    isComplaint: true
  };

  const [reviews, totalCount] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        appointment: {
          include: {
            doctor: {
              select: {
                uid: true,
                name: true,
                specialization: true
              }
            },
            patient: {
              select: {
                uid: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.review.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    reviews,
    pagination: {
      currentPage: page,
      totalPages,
      totalReviews: totalCount,
      hasMore: page < totalPages,
      limit
    }
  };
};

/**
 * Update complaint with admin notes and action taken
 */
export const updateComplaintAction = async (
  reviewId: string,
  adminNotes?: string,
  adminActionTaken?: string
) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  });

  if (!review) {
    throw new Error('Review not found');
  }

  if (!review.isComplaint) {
    throw new Error('Can only update admin notes for complaint reviews');
  }

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      ...(adminNotes !== undefined && { adminNotes }),
      ...(adminActionTaken !== undefined && { adminActionTaken })
    },
    include: {
      appointment: {
        include: {
          doctor: {
            select: {
              name: true,
              specialization: true
            }
          },
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

  return updatedReview;
};

/**
 * Check if patient can review an appointment
 */
export const canReviewAppointment = async (appointmentId: string, patientUid: string): Promise<{
  canReview: boolean;
  reason?: string;
}> => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      review: true
    }
  });

  if (!appointment) {
    return { canReview: false, reason: 'Appointment not found' };
  }

  if (appointment.patientUid !== patientUid) {
    return { canReview: false, reason: 'Not authorized to review this appointment' };
  }

  if (appointment.status !== 'COMPLETED') {
    return { canReview: false, reason: 'Can only review completed appointments' };
  }

  if (appointment.review) {
    return { canReview: false, reason: 'Review already submitted for this appointment' };
  }

  return { canReview: true };
};

/**
 * Get reviews written by a specific patient
 */
export const getPatientReviews = async (
  patientUid: string,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;

  const where: Prisma.ReviewWhereInput = {
    appointment: {
      patientUid: patientUid
    }
  };

  const [reviews, totalCount] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        appointment: {
          include: {
            doctor: {
              select: {
                name: true,
                specialization: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.review.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    reviews,
    pagination: {
      currentPage: page,
      totalPages,
      totalReviews: totalCount,
      hasMore: page < totalPages,
      limit
    }
  };
};

/**
 * Get public reviews for a specific doctor (excludes complaints)
 * This is for patients/public to view when browsing doctors
 */
export const getPublicDoctorReviews = async (
  doctorUid: string,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;

  // Only show non-complaint reviews publicly
  const where: Prisma.ReviewWhereInput = {
    appointment: {
      doctorUid: doctorUid
    },
    isComplaint: false
  };

  const [reviews, totalCount] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        appointment: {
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.review.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    reviews,
    pagination: {
      currentPage: page,
      totalPages,
      totalReviews: totalCount,
      hasMore: page < totalPages,
      limit
    }
  };
};

/**
 * Get public rating for a specific doctor
 * This is for patients/public to view when browsing doctors
 */
export const getPublicDoctorRating = async (doctorUid: string) => {
  const doctor = await prisma.doctor.findUnique({
    where: { uid: doctorUid },
    select: {
      averageRating: true,
      totalReviews: true,
      name: true,
      specialization: true
    }
  });

  if (!doctor) {
    throw new Error('Doctor not found');
  }

  return {
    doctorUid,
    doctorName: doctor.name,
    specialization: doctor.specialization,
    averageRating: doctor.averageRating || 0,
    totalReviews: doctor.totalReviews || 0
  };
};
