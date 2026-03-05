import { useAdminApiQuery } from './useAdminApiQuery';
import { apiFetchJson, getApiBaseUrl } from '../api-client';

export interface AdminMeResponse {
  admin?: {
    role?: string;
    mustChangePassword?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface AdminDashboardStats {
  totalDoctors: number;
  totalPatients: number;
  totalVerifications: number;
  pendingVerifications: number;
  approvedDoctors: number;
  approvedVerifications: number;
  rejectedApplications: number;
  rejectedVerifications: number;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
}

const ADMIN_BASE = `${getApiBaseUrl()}/api/admin`;

export const adminKeys = {
  me: ['admin', 'me'] as const,
  dashboardStats: ['admin', 'dashboard', 'stats'] as const,
};

export const useAdminMe = (token: string | null, enabled: boolean = true) =>
  useAdminApiQuery<AdminMeResponse>({
    queryKey: adminKeys.me,
    queryFn: () =>
      apiFetchJson<AdminMeResponse>(`${ADMIN_BASE}/me`, {
        token,
      }),
    enabled: enabled && !!token,
    staleTime: 60 * 1000,
  });

export const useAdminDashboardStats = (token: string | null, enabled: boolean = true) =>
  useAdminApiQuery<AdminDashboardStats>({
    queryKey: adminKeys.dashboardStats,
    queryFn: () =>
      apiFetchJson<AdminDashboardStats>(`${ADMIN_BASE}/dashboard/stats`, {
        token,
      }),
    enabled: enabled && !!token,
    staleTime: 30 * 1000,
  });
