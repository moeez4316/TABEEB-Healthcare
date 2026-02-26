import { useQuery, QueryKey, UseQueryOptions } from '@tanstack/react-query';

export function useApiQuery<TData, TError = Error>(
  options: UseQueryOptions<TData, TError, TData, QueryKey>
) {
  return useQuery({
    placeholderData: (previous) => previous,
    ...options,
  });
}
