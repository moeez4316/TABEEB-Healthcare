
import { useState } from "react";

export default function MedicalRecordCard({ record, onDelete }: { record: any, onDelete?: (id: string) => void }) {
  const [showPreview, setShowPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isImage = (type: string) => type.startsWith("image/");
  const isPDF = (type: string) => type === "application/pdf";

  return (
    <div className="p-5 rounded-2xl shadow-xl border-2 border-teal-100 dark:border-teal-900 bg-white/90 dark:bg-[#18181b]/90 flex flex-col gap-3 transition-all hover:shadow-2xl hover:border-teal-300 dark:hover:border-teal-700">
      <div className="flex items-center justify-between mb-1">
        <span className="inline-flex items-center gap-2 text-base font-semibold text-teal-700 dark:text-teal-300">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.828a2 2 0 0 0-.586-1.414l-4.828-4.828A2 2 0 0 0 13.172 2H6Z" stroke="currentColor" strokeWidth="1.5"/></svg>
          {record.fileName || 'Medical Record'}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(record.uploadedAt).toLocaleDateString()}<span className="hidden sm:inline">, {new Date(record.uploadedAt).toLocaleTimeString()}</span></span>
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
      <div className="flex gap-2 mt-2">
        <button
          className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-4 py-1.5 rounded-lg text-sm font-semibold shadow transition-all duration-200 active:scale-95"
          onClick={() => setShowPreview(true)}
        >
          View
        </button>
        {onDelete && (
          <button
            className={`bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold shadow disabled:opacity-50 transition-all duration-200 active:scale-95 ${deleting ? 'animate-pulse' : ''}`}
            onClick={async () => {
              setDeleting(true);
              await onDelete(record._id);
              setDeleting(false);
            }}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Record'}
          </button>
        )}
      </div>

      {/* Fullscreen Modal Preview */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl h-[80vh] flex items-center justify-center">
            <button
              className="absolute top-4 right-4 bg-white dark:bg-[#23232a] text-gray-700 dark:text-gray-200 rounded-full p-2 shadow hover:bg-gray-100 dark:hover:bg-[#18181b] focus:outline-none"
              onClick={() => setShowPreview(false)}
              aria-label="Close preview"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="w-full h-full flex items-center justify-center bg-white dark:bg-[#18181b] rounded-xl p-4 shadow-xl">
              {isImage(record.fileType) && (
                <img
                  src={record.fileUrl}
                  alt={record.notes || "Medical record image"}
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
