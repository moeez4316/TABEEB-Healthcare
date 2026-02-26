import { QueryKey, UseQueryOptions } from '@tanstack/react-query';
import { useApiQuery } from './useApiQuery';

const DEFAULT_ADMIN_STALE_MS = 60 * 1000;

export function useAdminApiQuery<TData, TError = Error>(
  options: UseQueryOptions<TData, TError, TData, QueryKey>
) {
  return useApiQuery<TData, TError>({
    staleTime: DEFAULT_ADMIN_STALE_MS,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    ...options,
  });
}
