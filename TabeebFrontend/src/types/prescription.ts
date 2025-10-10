// Re-export types from prescription slice for consistency
export type {
  Medicine,
  Prescription,
  PrescriptionStats,
} from '@/store/slices/prescriptionSlice';

// Import types for use in this file
import type { Medicine, Prescription } from '@/store/slices/prescriptionSlice';

// Additional types for API requests
export interface CreatePrescriptionRequest {
  patientUid: string;
  appointmentId?: string;
  diagnosis?: string;
  notes?: string;
  instructions?: string;
  medicines: Omit<Medicine, 'id'>[];
}

export interface UpdatePrescriptionRequest {
  diagnosis?: string;
  notes?: string;
  instructions?: string;
  medicines?: Omit<Medicine, 'id'>[];
  isActive?: boolean;
}

// Form validation types
export interface PrescriptionFormData {
  patientUid: string;
  appointmentId?: string;
  diagnosis: string;
  notes?: string;
  instructions?: string;
  medicines: MedicineFormData[];
}

export interface MedicineFormData {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  durationDays?: number; // New field for duration in days
  instructions?: string;
  timing?: string;
}

// Medicine tracking types
export interface MedicineProgress {
  status: 'active' | 'expiring' | 'expired' | 'completed';
  daysRemaining: number;
  daysTotal: number;
  progressPercentage: number;
}

export interface MedicineWithProgress extends Medicine {
  progress?: MedicineProgress;
}

export interface PrescriptionOverallProgress {
  status: 'active' | 'expiring' | 'expired' | 'completed';
  daysRemaining: number;
  daysTotal: number;
  progressPercentage: number;
}

export interface PrescriptionWithProgress extends Prescription {
  medicines: MedicineWithProgress[];
  overallProgress?: PrescriptionOverallProgress;
  activeMedicinesCount?: number;
  totalMedicinesCount?: number;
}

// UI state types
export interface PrescriptionFormErrors {
  diagnosis?: string;
  medicines?: {
    [index: number]: {
      medicineName?: string;
      dosage?: string;
      frequency?: string;
      duration?: string;
    };
  };
  general?: string;
}

export interface PrescriptionListFilters {
  isActive?: boolean;
  page?: number;
  limit?: number;
  searchTerm?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

// Component prop types
export interface PrescriptionCardProps {
  prescription: Prescription;
  showPatientInfo?: boolean;
  showDoctorInfo?: boolean;
  onEdit?: (prescription: Prescription) => void;
  onDelete?: (prescriptionId: string) => void;
  onView?: (prescription: Prescription) => void;
}

export interface MedicineListProps {
  medicines: Medicine[];
  editable?: boolean;
  onMedicineChange?: (index: number, medicine: MedicineFormData) => void;
  onRemoveMedicine?: (index: number) => void;
}

export interface PrescriptionFormProps {
  initialData?: Partial<PrescriptionFormData>;
  appointmentId?: string;
  patientInfo?: {
    uid: string;
    name: string;
    age: number;
    gender: string;
  };
  onSubmit: (data: PrescriptionFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}