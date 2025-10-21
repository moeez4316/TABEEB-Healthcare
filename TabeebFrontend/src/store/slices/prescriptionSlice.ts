import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Prescription interfaces
export interface Medicine {
  id?: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  durationDays?: number; // New field for duration in days
  instructions?: string;
  timing?: string;
}

export interface Prescription {
  id: string;
  prescriptionId: string;
  doctorUid: string;
  patientUid: string;
  appointmentId?: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  diagnosis?: string;
  notes?: string;
  instructions?: string;
  prescriptionStartDate?: string;
  prescriptionEndDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  medicines: Medicine[];
  doctor?: {
    name: string;
    specialization?: string;
    qualification?: string;
  };
  patient?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  appointment?: {
    appointmentDate: string;
    startTime: string;
  };
}

export interface PrescriptionStats {
  totalPrescriptions: number;
  activePrescriptions: number;
  inactivePrescriptions: number;
  thisMonthPrescriptions: number;
}

  export interface PaginationPayload {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }

interface PrescriptionState {
  // Doctor-related state
  doctorPrescriptions: Prescription[];
  prescriptionStats: PrescriptionStats | null;
  
  // Patient-related state
  patientPrescriptions: Prescription[];
  
  // Shared state
  currentPrescription: Prescription | null;
  appointmentPrescriptions: Prescription[];
  
  // UI state
  loading: {
    doctorPrescriptions: boolean;
    patientPrescriptions: boolean;
    prescriptionStats: boolean;
    currentPrescription: boolean;
    appointmentPrescriptions: boolean;
    creating: boolean;
    updating: boolean;
    deleting: boolean;
  };
  
  error: {
    doctorPrescriptions: string | null;
    patientPrescriptions: string | null;
    prescriptionStats: string | null;
    currentPrescription: string | null;
    appointmentPrescriptions: string | null;
    creating: string | null;
    updating: string | null;
    deleting: string | null;
  };
  
  // Pagination
  pagination: {
    doctorPrescriptions: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    patientPrescriptions: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

const initialState: PrescriptionState = {
  doctorPrescriptions: [],
  patientPrescriptions: [],
  currentPrescription: null,
  appointmentPrescriptions: [],
  prescriptionStats: null,
  
  loading: {
    doctorPrescriptions: false,
    patientPrescriptions: false,
    prescriptionStats: false,
    currentPrescription: false,
    appointmentPrescriptions: false,
    creating: false,
    updating: false,
    deleting: false,
  },
  
  error: {
    doctorPrescriptions: null,
    patientPrescriptions: null,
    prescriptionStats: null,
    currentPrescription: null,
    appointmentPrescriptions: null,
    creating: null,
    updating: null,
    deleting: null,
  },
  
  pagination: {
    doctorPrescriptions: {
      currentPage: 1,
      totalPages: 0,
      totalCount: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },
    patientPrescriptions: {
      currentPage: 1,
      totalPages: 0,
      totalCount: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },
  },
};

const prescriptionSlice = createSlice({
  name: 'prescription',
  initialState,
  reducers: {
    // Loading states
    setLoading: (state, action: PayloadAction<{ key: keyof PrescriptionState['loading']; value: boolean }>) => {
      state.loading[action.payload.key] = action.payload.value;
    },
    
    // Error states
    setError: (state, action: PayloadAction<{ key: keyof PrescriptionState['error']; value: string | null }>) => {
      state.error[action.payload.key] = action.payload.value;
    },
    
    // Clear all errors
    clearErrors: (state) => {
      Object.keys(state.error).forEach((key) => {
        state.error[key as keyof PrescriptionState['error']] = null;
      });
    },
    
    // Doctor prescriptions
  setDoctorPrescriptions: (state, action: PayloadAction<{ data: Prescription[]; pagination?: PaginationPayload }>) => {
      state.doctorPrescriptions = action.payload.data;
      if (action.payload.pagination) {
        state.pagination.doctorPrescriptions = action.payload.pagination;
      }
    },
    
    // Patient prescriptions
  setPatientPrescriptions: (state, action: PayloadAction<{ data: Prescription[]; pagination?: PaginationPayload }>) => {
      state.patientPrescriptions = action.payload.data;
      if (action.payload.pagination) {
        state.pagination.patientPrescriptions = action.payload.pagination;
      }
    },
    
    // Current prescription
    setCurrentPrescription: (state, action: PayloadAction<Prescription | null>) => {
      state.currentPrescription = action.payload;
    },
    
    // Appointment prescriptions
    setAppointmentPrescriptions: (state, action: PayloadAction<Prescription[]>) => {
      state.appointmentPrescriptions = action.payload;
    },
    
    // Prescription stats
    setPrescriptionStats: (state, action: PayloadAction<PrescriptionStats>) => {
      state.prescriptionStats = action.payload;
    },
    
    // Add new prescription (optimistic update)
    addPrescription: (state, action: PayloadAction<Prescription>) => {
      state.doctorPrescriptions.unshift(action.payload);
      if (state.prescriptionStats) {
        state.prescriptionStats.totalPrescriptions += 1;
        state.prescriptionStats.activePrescriptions += 1;
      }
    },
    
    // Update prescription
    updatePrescription: (state, action: PayloadAction<Prescription>) => {
      const index = state.doctorPrescriptions.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.doctorPrescriptions[index] = action.payload;
      }
      
      const patientIndex = state.patientPrescriptions.findIndex(p => p.id === action.payload.id);
      if (patientIndex !== -1) {
        state.patientPrescriptions[patientIndex] = action.payload;
      }
      
      if (state.currentPrescription?.id === action.payload.id) {
        state.currentPrescription = action.payload;
      }
    },
    
    // Delete prescription (soft delete)
    deletePrescription: (state, action: PayloadAction<string>) => {
      const prescriptionId = action.payload;
      
      // Update in doctor prescriptions
      const doctorIndex = state.doctorPrescriptions.findIndex(p => p.id === prescriptionId);
      if (doctorIndex !== -1) {
        state.doctorPrescriptions[doctorIndex].isActive = false;
      }
      
      // Update in patient prescriptions
      const patientIndex = state.patientPrescriptions.findIndex(p => p.id === prescriptionId);
      if (patientIndex !== -1) {
        state.patientPrescriptions[patientIndex].isActive = false;
      }
      
      // Update current prescription if it matches
      if (state.currentPrescription?.id === prescriptionId) {
        state.currentPrescription.isActive = false;
      }
      
      // Update stats
      if (state.prescriptionStats) {
        state.prescriptionStats.activePrescriptions -= 1;
        state.prescriptionStats.inactivePrescriptions += 1;
      }
    },
    
    // Reset state
    resetPrescriptionState: (state) => {
      return initialState;
    },
  },
});

export const {
  setLoading,
  setError,
  clearErrors,
  setDoctorPrescriptions,
  setPatientPrescriptions,
  setCurrentPrescription,
  setAppointmentPrescriptions,
  setPrescriptionStats,
  addPrescription,
  updatePrescription,
  deletePrescription,
  resetPrescriptionState,
} = prescriptionSlice.actions;

export default prescriptionSlice.reducer;