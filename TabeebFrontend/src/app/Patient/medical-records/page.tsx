"use client";

import { useEffect, useState } from "react";
import { uploadMedicalRecord } from "@/lib/uploadMedicalRecord";
import { getMedicalRecords } from "@/lib/getMedicalRecords";
import { useAuth } from '@/lib/auth-context';
import MedicalRecordCard from "@/components/MedicalRecordCard";
import { deleteMedicalRecord } from '@/lib/deleteMedicalRecord';

export default function MedicalRecordsPage() {
  const { user, token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      getMedicalRecords(token).then(setRecords).catch(console.error);
    }
  }, [token]);

  const [uploading, setUploading] = useState(false);
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !token) return;
    setUploading(true);
    try {
      await uploadMedicalRecord(file, tags, notes, token);
      setTags(""); setNotes(""); setFile(null);
      const updated = await getMedicalRecords(token);
      setRecords(updated);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    try {
      await deleteMedicalRecord(id, token);
      setRecords(records => records.filter(r => r._id !== id));
    } catch (err) {
      alert('Failed to delete record');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-10 px-2 sm:px-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1e293b] dark:text-[#ededed] drop-shadow-sm">Medical Records</h1>
        </div>
        <div className="bg-white/80 dark:bg-[#18181b]/80 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-8 backdrop-blur-md transition-all">
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Upload File</label>
                <input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-700 dark:text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tags</label>
                <input type="text" placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-[#23232a] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notes</label>
              <textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-[#23232a] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[80px]" />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={uploading}
                className={`bg-blue-600 hover:bg-blue-700 transition-transform transition-colors text-white px-8 py-2 rounded-xl font-bold shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95 ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {uploading ? <span className="animate-pulse">Uploading...</span> : 'Upload'}
              </button>
            </div>
          </form>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-6 text-[#1e293b] dark:text-[#ededed] tracking-tight">Your Uploaded Records</h2>
          {records.length === 0 ? (
            <div className="text-center text-gray-400 dark:text-gray-500 py-16 text-lg font-medium">No records uploaded yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {records.map(record => (
                <MedicalRecordCard key={record._id} record={record} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
