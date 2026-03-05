import { useApiQuery } from './useApiQuery';
import { apiFetchJson, getApiBaseUrl } from '../api-client';
import { AppointmentWithDetails } from '@/types/appointment';

const API_BASE = `${getApiBaseUrl()}/api/appointments`;

export const appointmentKeys = {
  patientList: ['appointments', 'patient'] as const,
  doctorList: (limit: number) => ['appointments', 'doctor', { limit }] as const,
  byId: (appointmentId: string) => ['appointments', 'detail', appointmentId] as const,
  followUpEligibility: (doctorUid: string) => ['appointments', 'follow-up', doctorUid] as const,
};

export const usePatientAppointments = (token: string | null, enabled: boolean = true) =>
  useApiQuery<AppointmentWithDetails[]>({
    queryKey: appointmentKeys.patientList,
    queryFn: () =>
      apiFetchJson<AppointmentWithDetails[]>(`${API_BASE}/patient`, {
        token,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    enabled: enabled && !!token,
    staleTime: 30 * 1000,
  });

export const useDoctorAppointments = (
  token: string | null,
  limit: number = 100,
  enabled: boolean = true
) =>
  useApiQuery<AppointmentWithDetails[]>({
    queryKey: appointmentKeys.doctorList(limit),
    queryFn: () =>
      apiFetchJson<AppointmentWithDetails[]>(`${API_BASE}/doctor?limit=${limit}`, {
        token,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    enabled: enabled && !!token,
    staleTime: 30 * 1000,
  });

export const useAppointmentById = (
  token: string | null,
  appointmentId: string | null,
  enabled: boolean = true
) =>
  useApiQuery<AppointmentWithDetails>({
    queryKey: appointmentId ? appointmentKeys.byId(appointmentId) : ['appointments', 'detail', 'missing'],
    queryFn: () =>
      apiFetchJson<AppointmentWithDetails>(`${API_BASE}/${appointmentId}`, {
        token,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    enabled: enabled && !!token && !!appointmentId,
    staleTime: 30 * 1000,
  });

export const useFollowUpEligibility = (
  token: string | null,
  doctorUid: string | null,
  enabled: boolean = true
) =>
  useApiQuery<{ eligible: boolean; discountPercentage?: number; reason?: string }>({
    queryKey: doctorUid ? appointmentKeys.followUpEligibility(doctorUid) : ['appointments', 'follow-up', 'missing'],
    queryFn: () =>
      apiFetchJson<{ eligible: boolean; discountPercentage?: number; reason?: string }>(`${API_BASE}/follow-up/eligibility/${doctorUid}`, {
        token,
      }),
    enabled: enabled && !!token && !!doctorUid,
    staleTime: 2 * 60 * 1000,
  });
