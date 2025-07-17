export async function deleteMedicalRecord(id: string, token: string) {
  const res = await fetch(`http://localhost:5002/api/records/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to delete record');
  return res.json();
}
