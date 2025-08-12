// Appointment System Types
export interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
  isAvailable: boolean;
  isBooked: boolean;
}

export interface SlotStatistics {
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  utilization: string;
}

export interface DoctorInfo {
  name: string;
  specialization: string;
  consultationFees: number | null;
}

export interface Schedule {
  startTime: string;
  endTime: string;
  slotDuration: number;
  breakTimes: string[]; // Array of "HH:MM-HH:MM" formatted break times
}

export interface SlotResponse {
  date: string;
  doctor: DoctorInfo;
  schedule: Schedule;
  availableSlots: TimeSlot[];
  allSlots: TimeSlot[];
  statistics: SlotStatistics;
  message: string;
}

export interface AppointmentBooking {
  doctorUid: string;
  appointmentDate: string;
  startTime: string;
  patientNotes?: string;
}

export interface Appointment {
  id: string;
  doctorUid: string;
  patientUid: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  consultationFees: number;
  patientNotes?: string;
  createdAt: string;
  updatedAt: string;
  doctor?: DoctorInfo;
  patient?: {
    name: string;
    phone: string;
  };
}

export interface Doctor {
  uid: string;
  name: string;
  specialization: string;
  consultationFees: number;
  rating?: number;
  isAvailable?: boolean;
}

export interface AvailabilityData {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  consultationDuration: number;
  breakTimes?: Array<{ startTime: string; endTime: string }>;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AppointmentFilters {
  status?: string;
  date?: string;
  page?: number;
  limit?: number;
}
