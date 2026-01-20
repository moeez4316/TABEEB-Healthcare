import { handleRateLimit } from './api-utils';

export async function getMedicalRecords(token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${API_URL}/api/records`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    if (res.status === 429) {
      const data = await res.json().catch(() => ({}));
      return handleRateLimit(data.retryAfter);
    }
    throw new Error("Failed to fetch records");
  }
  return res.json();
}
