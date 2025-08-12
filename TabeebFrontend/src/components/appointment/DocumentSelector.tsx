'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getMedicalRecords } from '@/lib/getMedicalRecords';

interface MedicalRecord {
  _id: string;
  fileUrl: string;
  fileType: string;
  tags: string[];
  notes?: string;
  uploadedAt: string;
}

interface DocumentSelectorProps {
  selectedDocuments: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  className?: string;
}

export const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  selectedDocuments,
  onSelectionChange,
  className = ''
}) => {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchDocuments();
    }
  }, [token]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const records = await getMedicalRecords(token!);
      setDocuments(records);
    } catch (err) {
      console.error('Error fetching medical records:', err);
      setError('Failed to load your medical records');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentToggle = (documentId: string) => {
    if (selectedDocuments.includes(documentId)) {
      onSelectionChange(selectedDocuments.filter(id => id !== documentId));
    } else {
      onSelectionChange([...selectedDocuments, documentId]);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return (
        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    } else if (fileType === 'application/pdf') {
      return (
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg border border-red-200 dark:border-red-700 p-6 ${className}`}>
        <div className="text-red-600 dark:text-red-400 text-sm">
          {error}
          <button
            onClick={fetchDocuments}
            className="ml-2 text-red-500 hover:text-red-700 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className={`bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 ${className}`}>
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
          </div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">No Medical Records</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You haven't uploaded any medical records yet. You can upload records from your medical records page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
          📎 Share Medical Documents
        </h4>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {selectedDocuments.length} of {documents.length} selected
        </span>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Select documents you'd like to share with the doctor for this appointment. This helps them prepare better for your consultation.
      </p>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {documents.map((document) => (
          <div
            key={document._id}
            className={`
              flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer
              ${selectedDocuments.includes(document._id)
                ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-700'
                : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600'
              }
            `}
            onClick={() => handleDocumentToggle(document._id)}
          >
            <input
              type="checkbox"
              checked={selectedDocuments.includes(document._id)}
              onChange={() => handleDocumentToggle(document._id)}
              className="mt-1 h-4 w-4 text-teal-600 rounded focus:ring-teal-500 border-gray-300 dark:border-gray-600"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                {getFileIcon(document.fileType)}
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  Medical Record
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(document.uploadedAt).toLocaleDateString()}
                </span>
              </div>
              
              {document.tags && document.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {document.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {document.notes && (
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {document.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedDocuments.length > 0 && (
        <div className="mt-4 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-700">
          <div className="flex items-center space-x-2 text-sm text-teal-700 dark:text-teal-300">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>
              {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} will be shared with the doctor
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
