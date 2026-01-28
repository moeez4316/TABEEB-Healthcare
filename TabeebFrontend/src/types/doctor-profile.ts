import { BlogTag } from './blog';

export interface DoctorVerification {
  isVerified: boolean;
  status: 'not-submitted' | 'pending' | 'approved' | 'rejected';
  pmdcNumber: string | null;
  graduationYear: string | null;
  degreeInstitution: string | null;
}

export interface DoctorStats {
  totalAppointments: number;
  completedAppointments: number;
  totalPatients: number;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface DoctorBlogPreview {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string;
  readTime: number;
  viewCount: number;
  publishedAt: string;
  tags: BlogTag[];
}

export interface DoctorReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date | string;
  patientName: string;
}

export interface PublicDoctorProfile {
  // Basic Information
  uid: string;
  name: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  specialization: string;
  qualification: string;
  experience: string | null;
  
  // Contact & Location
  email: string | null;
  phone: string | null;
  addressCity: string | null;
  addressProvince: string | null;
  
  // Professional Details
  hourlyConsultationRate: number | null;
  language: string;
  
  // Verification
  verification: DoctorVerification;
  
  // Statistics
  stats: DoctorStats;
  
  // Recent Content
  recentBlogs: DoctorBlogPreview[];
  recentReviews: DoctorReview[];
  totalPublishedBlogs: number;
}

export interface AvailabilityDay {
  date: string;
  dayOfWeek: string;
  isAvailable: boolean;
  totalSlots: number;
  availableSlots: number;
  startTime?: string;
  endTime?: string;
}

export interface DoctorAvailabilitySummary {
  doctorUid: string;
  availabilitySummary: AvailabilityDay[];
}
