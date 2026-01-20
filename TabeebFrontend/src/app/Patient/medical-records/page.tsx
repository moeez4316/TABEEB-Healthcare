"use client";

import { useEffect, useState, useRef } from "react";
import { uploadMedicalRecord } from "@/lib/uploadMedicalRecord";
import { getMedicalRecords } from "@/lib/getMedicalRecords";
import { useAuth } from '@/lib/auth-context';
import MedicalRecordCard from "@/components/MedicalRecordCard";
import { deleteMedicalRecord } from '@/lib/deleteMedicalRecord';
import { CircularProgress, useUploadProgress } from '@/components/shared/UploadProgress';

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
  const [files, setFiles] = useState<File[]>([]);
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [currentFileName, setCurrentFileName] = useState<string>("");
  const uploadProgress = useUploadProgress();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (token) {
      getMedicalRecords(token).then(setRecords).catch(console.error);
    }
  }, [token]);

  const [uploading, setUploading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    
    const fileArray = Array.from(selectedFiles);
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    
    // Validate all files
    const invalidFiles = fileArray.filter(f => !allowedTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      setUploadError(`Invalid file types: ${invalidFiles.map(f => f.name).join(', ')}. Only PDF and images allowed.`);
      return;
    }
    
    const oversizedFiles = fileArray.filter(f => f.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setUploadError(`Files too large (max 10MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    setUploadError("");
    setFiles(fileArray);
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0 || !token) return;
    
    setUploadError("");
    setUploading(true);
    setCurrentFileIndex(0);
    
    const totalFiles = files.length;
    const failedFiles: string[] = [];
    
    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      setCurrentFileIndex(i);
      setCurrentFileName(file.name);
      uploadProgress.startUpload();
      
      try {
        await uploadMedicalRecord(file, tags, notes, token, {
          onProgress: (progressData) => {
            // Adjust progress to account for multiple files
            // progressData is { percentage: number }
            const filePercentage = progressData.percentage || 0;
            const baseProgress = (i / totalFiles) * 100;
            const fileProgress = (filePercentage / totalFiles);
            uploadProgress.updateProgress(Math.round(baseProgress + fileProgress));
          }
        });
      } catch (error) {
        console.error(`Upload error for ${file.name}:`, error);
        failedFiles.push(file.name);
      }
    }
    
    // Processing/saving phase
    uploadProgress.startProcessing();
    
    // Refresh records
    const updated = await getMedicalRecords(token);
    setRecords(updated);
    
    // Reset form
    setTags("");
    setNotes("");
    setFiles([]);
    setCurrentFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    if (failedFiles.length > 0) {
      setUploadError(`Failed to upload: ${failedFiles.join(', ')}`);
      uploadProgress.fail(`${failedFiles.length} file(s) failed`);
    } else {
      uploadProgress.complete();
    }
    
    setUploading(false);
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
      {/* Upload Progress Overlay */}
      {uploading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4">
            <CircularProgress
              progress={uploadProgress.progress}
              status={uploadProgress.status}
              fileName={currentFileName}
              errorMessage={uploadProgress.error || undefined}
              size="lg"
            />
            {files.length > 1 && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                Uploading file {currentFileIndex + 1} of {files.length}
              </p>
            )}
          </div>
        </div>
      )}
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-[#1e293b] dark:text-[#ededed] drop-shadow-sm">Medical Records</h1>
        </div>
        <div className="bg-white/80 dark:bg-[#18181b]/80 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-8 backdrop-blur-md transition-all">
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Upload Files</label>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="application/pdf,image/*" 
                  multiple
                  onChange={handleFileChange} 
                  className="block w-full text-sm text-gray-700 dark:text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 focus:outline-none" 
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">You can select multiple files at once</p>
                
                {/* Selected Files List */}
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{files.length} file(s) selected:</p>
                    <ul className="space-y-1 max-h-32 overflow-y-auto">
                      {files.map((file, index) => (
                        <li key={index} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                          <span className="truncate flex-1 text-gray-700 dark:text-gray-300">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tags</label>
                <input type="text" placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-[#23232a] text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-400" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tags will apply to all selected files</p>
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
                disabled={uploading || files.length === 0}
                className={`bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 transition-all duration-200 text-white px-8 py-2 rounded-xl font-bold shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-400 active:scale-95 ${uploading || files.length === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {uploading ? <span className="animate-pulse">Uploading...</span> : `Upload ${files.length > 0 ? `(${files.length})` : ''}`}
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
