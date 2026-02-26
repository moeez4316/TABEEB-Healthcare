import { fetchWithRateLimit } from './api-utils';

export interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

export const getApiBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || '';

export const buildAuthHeaders = (token?: string | null, extra?: HeadersInit) => {
  const headers = new Headers(extra || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
};

export async function apiFetchJson<T>(
  url: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, ...rest } = options;
  const headers = buildAuthHeaders(token, rest.headers);

  if (rest.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetchWithRateLimit(url, {
    ...rest,
    headers,
  });

  if (!response.ok) {
    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    const message =
      (data as { error?: string; message?: string })?.error ||
      (data as { error?: string; message?: string })?.message ||
      response.statusText ||
      `HTTP ${response.status}`;
    const error = new Error(message) as ApiError;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}
