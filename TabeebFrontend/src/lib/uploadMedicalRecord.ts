export async function uploadMedicalRecord(file: File, tags: string, notes: string, token: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("tags", tags);
  formData.append("notes", notes);

  const res = await fetch("http://localhost:5002/api/records", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  if (!res.ok) throw new Error("Failed to upload record");
  return res.json();
}
