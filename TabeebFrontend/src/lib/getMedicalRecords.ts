export async function getMedicalRecords(token: string) {
  const res = await fetch("http://localhost:5002/api/records", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) throw new Error("Failed to fetch records");
  return res.json();
}
