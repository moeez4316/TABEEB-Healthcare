/**
 * Handle rate limit - redirect to error page
 * Returns a promise that never resolves (since we're redirecting)
 */
export function handleRateLimit(retryAfter?: string): Promise<never> {
  const returnPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const params = new URLSearchParams({
    retry: retryAfter || '1 minute',
    return: returnPath,
  });
  if (typeof window !== 'undefined') {
    window.location.href = `/error/rate-limit?${params.toString()}`;
  }
  // Return a promise that never resolves - prevents further code execution while redirecting
  return new Promise(() => {});
}

/**
 * Check response for rate limit and handle it
 * Returns true if rate limited (and redirecting), false otherwise
 */
export async function checkRateLimit(response: Response): Promise<boolean> {
  if (response.status === 429) {
    const data = await response.json().catch(() => ({}));
    handleRateLimit(data.retryAfter);
    return true;
  }
  return false;
}

/**
 * Fetch wrapper that automatically handles rate limiting
 * Use this instead of fetch() for API calls
 */
export async function fetchWithRateLimit(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const response = await fetch(url, options);
  
  if (response.status === 429) {
    const data = await response.clone().json().catch(() => ({}));
    return handleRateLimit(data.retryAfter);
  }
  
  return response;
}
