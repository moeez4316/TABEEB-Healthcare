
import { useState } from "react";
import Image from "next/image";

interface MedicalRecord {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  tags: string[];
  notes?: string;
  uploadedAt: string;
}

interface MedicalRecordCardProps {
  record: MedicalRecord;
  onDelete?: (id: string) => void;
  onSummarize?: (record: MedicalRecord) => void;
}

export default function MedicalRecordCard({ record, onDelete, onSummarize }: MedicalRecordCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isImage = (type: string) => type.startsWith("image/");
  const isPDF = (type: string) => type === "application/pdf";

  return (
    <div className="p-3 sm:p-5 rounded-2xl shadow-xl border-2 border-teal-100 dark:border-teal-900 bg-white/90 dark:bg-[#18181b]/90 flex flex-col gap-2 sm:gap-3 transition-all hover:shadow-2xl hover:border-teal-300 dark:hover:border-teal-700 overflow-hidden">
      <div className="flex items-start sm:items-center justify-between gap-2 mb-1 min-w-0">
        <span className="inline-flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base font-semibold text-teal-700 dark:text-teal-300 min-w-0 overflow-hidden" title={record.fileName || 'Medical Record'}>
          <svg className="flex-shrink-0" width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.828a2 2 0 0 0-.586-1.414l-4.828-4.828A2 2 0 0 0 13.172 2H6Z" stroke="currentColor" strokeWidth="1.5"/></svg>
          <span className="truncate">{record.fileName || 'Medical Record'}</span>
        </span>
        <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 whitespace-nowrap">{new Date(record.uploadedAt).toLocaleDateString()}<span className="hidden sm:inline">, {new Date(record.uploadedAt).toLocaleTimeString()}</span></span>
      </div>
      <div className="flex flex-wrap gap-2 items-center mb-1">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Tags:</span>
        {record.tags?.length ? (
          <span className="flex flex-wrap gap-1">
            {record.tags.map((tag: string, i: number) => (
              <span key={i} className="bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full text-xs font-semibold">{tag}</span>
            ))}
          </span>
        ) : <span className="italic text-gray-400">None</span>}
      </div>
      {record.notes && <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-[#23232a] rounded px-2 py-1">{record.notes}</p>}
      <div className="flex flex-wrap gap-2 mt-2">
        <button
          className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold shadow transition-all duration-200 active:scale-95"
          onClick={() => setShowPreview(true)}
        >
          View
        </button>
        {onDelete && (
          <button
            className={`bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold shadow disabled:opacity-50 transition-all duration-200 active:scale-95 ${deleting ? 'animate-pulse' : ''}`}
            onClick={async () => {
              setDeleting(true);
              await onDelete(record.id);
              setDeleting(false);
            }}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        )}
        {onSummarize && (
          <button
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold shadow transition-all duration-200 active:scale-95 flex items-center gap-1 sm:gap-1.5"
            onClick={() => onSummarize(record)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v2m0 14v2M5.636 5.636l1.414 1.414m9.9 9.9l1.414 1.414M3 12h2m14 0h2M5.636 18.364l1.414-1.414m9.9-9.9l1.414-1.414"/></svg>
            <span className="hidden sm:inline">Summarize with AI</span><span className="sm:hidden">AI Summary</span>
          </button>
        )}
      </div>

      {/* Fullscreen Modal Preview */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-3 sm:p-6">
          <div className="relative w-full max-w-3xl h-[80vh] flex items-center justify-center">
            <button
              className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 bg-white dark:bg-[#23232a] text-gray-700 dark:text-gray-200 rounded-full p-1.5 sm:p-2 shadow hover:bg-gray-100 dark:hover:bg-[#18181b] focus:outline-none"
              onClick={() => setShowPreview(false)}
              aria-label="Close preview"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="w-full h-full flex items-center justify-center bg-white dark:bg-[#18181b] rounded-xl p-4 shadow-xl">
              {isImage(record.fileType) && (
                <Image
                  src={record.fileUrl}
                  alt={record.notes || "Medical record image"}
                  width={800}
                  height={600}
                  className="max-h-full max-w-full object-contain rounded-lg shadow"
                />
              )}
              {isPDF(record.fileType) && (
                <iframe
                  src={record.fileUrl}
                  title={record.notes || "Medical record PDF"}
                  className="w-full h-full rounded-lg border shadow"
                />
              )}
              {!isImage(record.fileType) && !isPDF(record.fileType) && (
                <div className="text-xs text-gray-400">Unsupported file type</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
