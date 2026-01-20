import { handleRateLimit } from './api-utils';

export async function deleteMedicalRecord(id: string, token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${API_URL}/api/records/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    if (res.status === 429) {
      const data = await res.json().catch(() => ({}));
      return handleRateLimit(data.retryAfter);
    }
    throw new Error('Failed to delete record');
  }
  return res.json();
}
