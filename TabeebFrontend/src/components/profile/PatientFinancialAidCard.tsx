'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, Heart, Loader2, Upload, X } from 'lucide-react';
import { Toast } from '@/components/Toast';
import {
  uploadMultipleFiles,
  validateFile,
  type UploadProgress,
} from '@/lib/cloudinary-upload';
import {
  financialAidAPI,
  type FinancialAidRequest,
  type FinancialAidStatus,
  type FinancialAidSummaryResponse,
} from '@/lib/financial-aid-api';

type NeedyChoice = 'yes' | 'no';

interface PatientFinancialAidCardProps {
  token: string | null;
}

interface DocumentSlot {
  id: string;
  docType: string;
  file: File | null;
}

const INITIAL_SLOTS: DocumentSlot[] = [
  { id: 'income-proof', docType: 'Income proof', file: null },
  { id: 'household-expense', docType: 'Household expense evidence', file: null },
  { id: 'medical-hardship', docType: 'Medical hardship evidence', file: null },
];

function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString();
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const base = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const amount = bytes / 1024 ** base;
  return `${amount.toFixed(base === 0 ? 0 : 1)} ${units[base]}`;
}

function getStatusTheme(status: FinancialAidStatus) {
  if (status === 'APPROVED') {
    return {
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      panel: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20',
      heading: 'text-emerald-800 dark:text-emerald-300',
      body: 'text-emerald-700 dark:text-emerald-300',
      title: 'Approved',
    };
  }

  if (status === 'REJECTED') {
    return {
      badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
      panel: 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-900/20',
      heading: 'text-rose-800 dark:text-rose-300',
      body: 'text-rose-700 dark:text-rose-300',
      title: 'Rejected',
    };
  }

  return {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    panel: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20',
    heading: 'text-amber-800 dark:text-amber-300',
    body: 'text-amber-700 dark:text-amber-300',
    title: 'Pending Review',
  };
}

export default function PatientFinancialAidCard({ token }: PatientFinancialAidCardProps) {
  const [summary, setSummary] = useState<FinancialAidSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needyChoice, setNeedyChoice] = useState<NeedyChoice>('no');
  const [slots, setSlots] = useState<DocumentSlot[]>(INITIAL_SLOTS);
  const [progressBySlot, setProgressBySlot] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    message: '',
    type: 'info',
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ show: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast({ show: false, message: '', type: 'info' });
  }, []);

  const loadSummary = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await financialAidAPI.getMyFinancialAidRequest(token);
      setSummary(data);
      setNeedyChoice(data.request ? 'yes' : 'no');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch financial aid status';
      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, token]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const request: FinancialAidRequest | null = summary?.request ?? null;
  const maxDocuments = summary?.maxDocuments ?? 3;
  const selectedFiles = useMemo(() => slots.filter((slot) => slot.file), [slots]);
  const showApplicationForm = !request || request.status === 'REJECTED';

  const updateSlotDocType = (id: string, docType: string) => {
    setSlots((prev) => prev.map((slot) => (slot.id === id ? { ...slot, docType } : slot)));
  };

  const updateSlotFile = (id: string, file: File | null) => {
    setSlots((prev) => prev.map((slot) => (slot.id === id ? { ...slot, file } : slot)));
  };

  const handleFileSelection = (slotId: string, file: File | null) => {
    if (!file) {
      updateSlotFile(slotId, null);
      return;
    }

    const validation = validateFile(file, {
      maxSizeMB: 10,
      allowedTypes: ['image/*', 'application/pdf'],
    });

    if (!validation.valid) {
      showToast(validation.error || 'Invalid file selected', 'error');
      return;
    }

    updateSlotFile(slotId, file);
  };

  const onUploadProgress = (selectedSlots: DocumentSlot[], index: number, progress: UploadProgress) => {
    const slot = selectedSlots[index];
    if (!slot) return;

    setProgressBySlot((prev) => ({
      ...prev,
      [slot.id]: progress.percentage,
    }));
  };

  const submitRequest = async () => {
    if (!token) {
      showToast('Please log in again and retry', 'error');
      return;
    }

    if (selectedFiles.length < 1) {
      showToast('Please upload at least one supporting document', 'error');
      return;
    }

    if (selectedFiles.length > maxDocuments) {
      showToast(`You can upload up to ${maxDocuments} documents only`, 'error');
      return;
    }

    setIsSubmitting(true);
    setProgressBySlot({});

    try {
      const filesToUpload = selectedFiles.map((slot) => ({
        file: slot.file as File,
        type: 'financial-aid-doc' as const,
        docType: slot.docType.trim() || 'Supporting document',
      }));

      const uploadResults = await uploadMultipleFiles(
        filesToUpload,
        token,
        (index, progress) => onUploadProgress(selectedFiles, index, progress)
      );

      const documents = uploadResults.map((result, index) => ({
        publicId: result.publicId,
        resourceType: result.resourceType,
        url: result.secureUrl,
        fileType: filesToUpload[index].file.type,
        fileName: filesToUpload[index].file.name,
        docType: filesToUpload[index].docType,
      }));

      const response = await financialAidAPI.submitMyFinancialAidRequest(token, {
        documents,
      });

      setSummary(response);
      setNeedyChoice('yes');
      setSlots((prev) => prev.map((slot) => ({ ...slot, file: null })));
      showToast('Financial aid request submitted and sent for admin review', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit financial aid request';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusTheme = request ? getStatusTheme(request.status) : null;

  return (
    <>
      <section className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-slate-700">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-teal-100 dark:bg-teal-900/30">
                <Heart className="w-6 h-6 text-teal-600 dark:text-teal-300" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Financial Support Request</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  If you are financially needy, you can apply for up to {summary?.discountPercent ?? 80}% consultation discount.
                  Your request is reviewed by admin before approval.
                </p>
              </div>
            </div>

            {request && statusTheme && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusTheme.badge}`}>
                {statusTheme.title}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/30 p-5">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading financial aid status...
              </div>
            </div>
          ) : (
            <>
              {request?.status === 'APPROVED' ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20 px-3 py-2">
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    Approved. Financial support is active.
                  </p>
                </div>
              ) : (
                request && statusTheme && (
                  <div className={`rounded-xl border p-4 ${statusTheme.panel}`}>
                    <p className={`font-semibold ${statusTheme.heading}`}>Request Status: {statusTheme.title}</p>
                    <p className={`text-sm mt-1 ${statusTheme.body}`}>
                      Submitted on {formatDate(request.submittedAt)}
                      {request.reviewedAt ? ` • Reviewed on ${formatDate(request.reviewedAt)}` : ''}
                    </p>

                    {request.rejectionReason && (
                      <p className="text-sm mt-2 text-rose-700 dark:text-rose-300">
                        Rejection reason: {request.rejectionReason}
                      </p>
                    )}

                    {request.adminComments && (
                      <p className="text-sm mt-1 text-slate-700 dark:text-slate-200">
                        Admin comments: {request.adminComments}
                      </p>
                    )}
                  </div>
                )
              )}

              {showApplicationForm && (
                <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Do you want to apply as financially needy?
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 cursor-pointer">
                      <input
                        type="radio"
                        name="financialNeedChoice"
                        checked={needyChoice === 'yes'}
                        onChange={() => setNeedyChoice('yes')}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">Yes, apply now</span>
                    </label>

                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 cursor-pointer">
                      <input
                        type="radio"
                        name="financialNeedChoice"
                        checked={needyChoice === 'no'}
                        onChange={() => setNeedyChoice('no')}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">No, not right now</span>
                    </label>
                  </div>
                </div>
              )}

              {showApplicationForm && needyChoice === 'yes' && (
                <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-4">
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <AlertCircle className="w-4 h-4 mt-0.5 text-amber-600 dark:text-amber-400" />
                    Upload up to {maxDocuments} supporting documents (at least 1 required). Accepted formats: JPG, PNG, PDF.
                  </div>

                  <div className="space-y-3">
                    {slots.map((slot) => (
                      <div key={slot.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                          <input
                            type="text"
                            value={slot.docType}
                            onChange={(event) => updateSlotDocType(slot.id, event.target.value)}
                            className="md:col-span-1 w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            placeholder="Document label"
                          />

                          <div className="md:col-span-2">
                            <input
                              id={`aid-file-${slot.id}`}
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              className="hidden"
                              onChange={(event) => handleFileSelection(slot.id, event.target.files?.[0] || null)}
                            />

                            {!slot.file ? (
                              <label
                                htmlFor={`aid-file-${slot.id}`}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-dashed border-gray-300 dark:border-slate-600 text-sm text-gray-700 dark:text-gray-200 cursor-pointer hover:border-teal-500"
                              >
                                <Upload className="w-4 h-4" />
                                Upload document
                              </label>
                            ) : (
                              <div className="rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 px-3 py-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white break-all">{slot.file.name}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{formatFileSize(slot.file.size)}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => updateSlotFile(slot.id, null)}
                                    className="text-rose-500 hover:text-rose-600"
                                    aria-label="Remove selected file"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {isSubmitting && typeof progressBySlot[slot.id] === 'number' && (
                          <div className="mt-3">
                            <div className="h-2 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
                              <div
                                className="h-2 bg-teal-600 transition-all duration-300"
                                style={{ width: `${progressBySlot[slot.id]}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Uploading: {Math.round(progressBySlot[slot.id])}%
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Selected documents: {selectedFiles.length} / {maxDocuments}
                    </p>

                    <button
                      type="button"
                      disabled={isSubmitting || selectedFiles.length === 0}
                      onClick={submitRequest}
                      className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors ${
                        isSubmitting || selectedFiles.length === 0
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-teal-600 hover:bg-teal-700'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Submit For Admin Review
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {request?.documents?.length ? (
                <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Uploaded Supporting Documents</p>
                  <div className="space-y-2">
                    {request.documents.map((document) => (
                      <a
                        key={document.id}
                        href={document.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 hover:border-teal-500 transition-colors"
                      >
                        <span className="inline-flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-200 truncate">
                            {document.docType || document.fileName || 'Supporting document'}
                          </span>
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(document.uploadedAt)}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
    </>
  );
}
