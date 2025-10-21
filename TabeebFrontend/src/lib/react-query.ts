import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 1000 * 60 * 5,
      // Keep data in cache for 10 minutes
      gcTime: 1000 * 60 * 10,
      // Retry failed requests 3 times
      retry: 3,
      // Refetch on window focus for real-time updates
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations 2 times
      retry: 2,
    },
  },
});

// Query Keys for consistent caching
export const QUERY_KEYS = {
  // Prescription related
  prescriptions: 'prescriptions',
  doctorPrescriptions: 'doctor-prescriptions',
  patientPrescriptions: 'patient-prescriptions',
  prescriptionById: 'prescription-by-id',
  prescriptionStats: 'prescription-stats',
  appointmentPrescriptions: 'appointment-prescriptions',
  
  // Existing keys (for consistency)
  appointments: 'appointments',
  doctors: 'doctors',
  patients: 'patients',
  medicalRecords: 'medical-records',
} as const;

// Helper function to create query keys with parameters
export const createQueryKey = (baseKey: string, params?: Record<string, string | number | boolean | null | undefined>) => {
  if (!params) return [baseKey];
  return [baseKey, params];
};