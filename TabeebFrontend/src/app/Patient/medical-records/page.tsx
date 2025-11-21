"use client";

import { useEffect, useState } from "react";
import { uploadMedicalRecord } from "@/lib/uploadMedicalRecord";
import { getMedicalRecords } from "@/lib/getMedicalRecords";
import { useAuth } from '@/lib/auth-context';
import MedicalRecordCard from "@/components/MedicalRecordCard";
import { deleteMedicalRecord } from '@/lib/deleteMedicalRecord';

interface MedicalRecord {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  tags: string[];
  notes?: string;
  uploadedAt: string;
}

export default function MedicalRecordsPage() {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (token) {
      getMedicalRecords(token).then(setRecords).catch(console.error);
    }
  }, [token]);

  const [uploading, setUploading] = useState(false);
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !token) return;
    
    setUploadError("");
    
    // Validate file size (10MB limit to match backend)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size must be less than 10MB");
      return;
    }
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Only PDF and image files (JPG, PNG, GIF) are allowed");
      return;
    }
    
    setUploading(true);
    try {
      await uploadMedicalRecord(file, tags, notes, token);
      setTags(""); setNotes(""); setFile(null);
      const updated = await getMedicalRecords(token);
      setRecords(updated);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;
    try {
      await deleteMedicalRecord(id, token);
      setRecords(records => records.filter(r => r._id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete record');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1e293b] dark:text-[#ededed] drop-shadow-sm">Medical Records</h1>
        </div>
        <div className="bg-white/80 dark:bg-[#18181b]/80 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-8 backdrop-blur-md transition-all">
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Upload File</label>
                <input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-700 dark:text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tags</label>
                <input type="text" placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-[#23232a] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notes</label>
              <textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-[#23232a] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[80px]" />
            </div>
            
            {uploadError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                {uploadError}
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={uploading}
                className={`bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 transition-all duration-200 text-white px-8 py-2 rounded-xl font-bold shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-400 active:scale-95 ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
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
      </main>
    </div>
  );
}
