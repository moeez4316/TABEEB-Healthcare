import { apiFetchJson, getApiBaseUrl } from './api-client';

const API_URL = getApiBaseUrl();

export type FinancialAidStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface FinancialAidDocumentPayload {
  publicId: string;
  resourceType?: string;
  url?: string;
  fileType?: string;
  fileName?: string;
  docType?: string;
}

export interface FinancialAidDocument {
  id: string;
  requestId: string;
  docType: string | null;
  fileUrl: string;
  publicId: string;
  resourceType: string;
  fileType: string | null;
  fileName: string | null;
  uploadedAt: string;
}

export interface FinancialAidRequest {
  id: string;
  patientUid: string;
  status: FinancialAidStatus;
  requestedDiscountPercent: number;
  adminComments: string | null;
  rejectionReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
  documents: FinancialAidDocument[];
}

export interface FinancialAidSummaryResponse {
  request: FinancialAidRequest | null;
  maxDocuments: number;
  discountPercent: number;
  isDiscountApproved: boolean;
}

interface SubmitFinancialAidRequestBody {
  documents: FinancialAidDocumentPayload[];
  requestedDiscountPercent?: number;
}

export const financialAidAPI = {
  getMyFinancialAidRequest(token: string) {
    return apiFetchJson<FinancialAidSummaryResponse>(`${API_URL}/api/patient/financial-aid`, {
      method: 'GET',
      token,
    });
  },

  submitMyFinancialAidRequest(token: string, body: SubmitFinancialAidRequestBody) {
    return apiFetchJson<FinancialAidSummaryResponse & { message: string }>(`${API_URL}/api/patient/financial-aid`, {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    });
  },
};
