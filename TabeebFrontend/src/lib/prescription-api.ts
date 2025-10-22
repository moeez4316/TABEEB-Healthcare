import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS, createQueryKey } from './react-query';
import { Prescription, Medicine, PrescriptionStats } from '@/store/slices/prescriptionSlice';

// Types for API requests
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

export interface PrescriptionResponse {
  success: boolean;
  message?: string;
  data: Prescription;
}

export interface PrescriptionsListResponse {
  success: boolean;
  data: Prescription[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface PrescriptionStatsResponse {
  success: boolean;
  data: PrescriptionStats;
}

// API Base URL
const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL;

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (
  endpoint: string,
  options: RequestInit = {},
  token: string
) => {
  const fullUrl = `${getApiUrl()}/api/prescriptions${endpoint}`;
  
  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: 'Network error or invalid JSON response' };
    }
    throw new Error(errorData.error || `HTTP ${response.status} - ${response.statusText}`);
  }

  return response.json();
};

// API Functions
export const prescriptionApi = {
  // Create prescription
  createPrescription: async (data: CreatePrescriptionRequest, token: string): Promise<PrescriptionResponse> => {
    return makeAuthenticatedRequest('/', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  // Get doctor's prescriptions
  getDoctorPrescriptions: async (
    token: string,
    page: number = 1,
    limit: number = 10,
    isActive: boolean = true
  ): Promise<PrescriptionsListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      isActive: isActive.toString(),
    });
    return makeAuthenticatedRequest(`/doctor?${params}`, {}, token);
  },

  // Get patient's prescriptions
  getPatientPrescriptions: async (
    token: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PrescriptionsListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return makeAuthenticatedRequest(`/patient?${params}`, {}, token);
  },

  // Get prescription by ID
  getPrescriptionById: async (prescriptionId: string, token: string): Promise<PrescriptionResponse> => {
    return makeAuthenticatedRequest(`/${prescriptionId}`, {}, token);
  },

  // Update prescription
  updatePrescription: async (
    prescriptionId: string,
    data: UpdatePrescriptionRequest,
    token: string
  ): Promise<PrescriptionResponse> => {
    return makeAuthenticatedRequest(`/${prescriptionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
  },

  // Delete prescription (soft delete)
  deletePrescription: async (prescriptionId: string, token: string): Promise<{ success: boolean; message: string }> => {
    return makeAuthenticatedRequest(`/${prescriptionId}`, {
      method: 'DELETE',
    }, token);
  },

  // Get prescription statistics
  getPrescriptionStats: async (token: string): Promise<PrescriptionStatsResponse> => {
    return makeAuthenticatedRequest('/doctor/stats', {}, token);
  },

  // Get prescriptions for appointment
  getAppointmentPrescriptions: async (appointmentId: string, token: string): Promise<PrescriptionsListResponse> => {
    return makeAuthenticatedRequest(`/appointment/${appointmentId}`, {}, token);
  },
};

// React Query Hooks

// Hook for creating prescription
export const useCreatePrescription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ data, token }: { data: CreatePrescriptionRequest; token: string }) =>
      prescriptionApi.createPrescription(data, token),
    onSuccess: () => {
      // Invalidate and refetch all prescription-related queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.doctorPrescriptions] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.patientPrescriptions] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.prescriptionStats] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.appointmentPrescriptions] });
    },
  });
};

// Hook for fetching doctor's prescriptions
export const useDoctorPrescriptions = (
  token: string | null,
  page: number = 1,
  limit: number = 10,
  isActive: boolean = true
) => {
  return useQuery({
    queryKey: createQueryKey(QUERY_KEYS.doctorPrescriptions, { page, limit, isActive }),
    queryFn: () => prescriptionApi.getDoctorPrescriptions(token!, page, limit, isActive),
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook for fetching patient's prescriptions
export const usePatientPrescriptions = (
  token: string | null,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: createQueryKey(QUERY_KEYS.patientPrescriptions, { page, limit }),
    queryFn: () => prescriptionApi.getPatientPrescriptions(token!, page, limit),
    enabled: !!token,
    staleTime: 1000 * 30, // 30 seconds - more responsive to changes
    refetchInterval: 1000 * 60, // Auto-refetch every 1 minute when component is active
    refetchOnWindowFocus: true, // Refetch when patient returns to the tab
  });
};

// Hook for fetching prescription by ID
export const usePrescriptionById = (prescriptionId: string, token: string | null) => {
  return useQuery({
    queryKey: createQueryKey(QUERY_KEYS.prescriptionById, { prescriptionId }),
    queryFn: () => prescriptionApi.getPrescriptionById(prescriptionId, token!),
    enabled: !!token && !!prescriptionId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// Hook for updating prescription
export const useUpdatePrescription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      prescriptionId, 
      data, 
      token 
    }: { 
      prescriptionId: string; 
      data: UpdatePrescriptionRequest; 
      token: string 
    }) => prescriptionApi.updatePrescription(prescriptionId, data, token),
    onSuccess: (_, variables) => {
      // Invalidate specific prescription
      queryClient.invalidateQueries({ 
        queryKey: createQueryKey(QUERY_KEYS.prescriptionById, { prescriptionId: variables.prescriptionId }) 
      });
      // Invalidate all prescription lists
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.doctorPrescriptions] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.patientPrescriptions] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.prescriptionStats] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.appointmentPrescriptions] });
    },
  });
};

// Hook for deleting prescription
export const useDeletePrescription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ prescriptionId, token }: { prescriptionId: string; token: string }) =>
      prescriptionApi.deletePrescription(prescriptionId, token),
    onSuccess: () => {
      // Invalidate all prescription-related queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.doctorPrescriptions] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.patientPrescriptions] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.prescriptionStats] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.appointmentPrescriptions] });
    },
  });
};

// Hook for fetching prescription statistics
export const usePrescriptionStats = (token: string | null) => {
  return useQuery({
    queryKey: [QUERY_KEYS.prescriptionStats],
    queryFn: () => prescriptionApi.getPrescriptionStats(token!),
    enabled: !!token,
    staleTime: 1000 * 60 * 2, // 2 minutes (stats change frequently)
  });
};

// Hook for fetching appointment prescriptions
export const useAppointmentPrescriptions = (appointmentId: string, token: string | null) => {
  return useQuery({
    queryKey: createQueryKey(QUERY_KEYS.appointmentPrescriptions, { appointmentId }),
    queryFn: () => prescriptionApi.getAppointmentPrescriptions(appointmentId, token!),
    enabled: !!token && !!appointmentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};