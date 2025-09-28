const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface VerificationData {
  doctorUid: string;
  isVerified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  cnic: string;
  pmdcNumber: string;
  certificate?: string;
  adminComments?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  doctor?: {
    name: string;
    email: string;
  };
}

export interface SubmitVerificationRequest {
  pmdcNumber: string;
  pmdcRegistrationDate: string;
  cnicNumber: string;
  cnicFront: File | null;
  cnicBack: File | null;
  verificationPhoto: File | null;
  degreeCertificate: File | null;
  pmdcCertificate: File | null;
  graduationYear: string;
  degreeInstitution: string;
}

class VerificationAPI {
  private getAuthHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  // Submit verification documents
  async submitVerification(data: SubmitVerificationRequest, token: string): Promise<{ message: string; [key: string]: unknown }> {
    // Validate minimum requirements
    if (!data.pmdcNumber) {
      throw new Error('PMDC Number is required');
    }
    
    if (!data.cnicFront && !data.cnicBack) {
      throw new Error('At least one CNIC document (front or back) is required');
    }

    // Real backend implementation - Full document support
    const formData = new FormData();
    
    // Add all form fields
    formData.append('pmdcNumber', data.pmdcNumber);
    formData.append('cnicNumber', data.cnicNumber);
    formData.append('graduationYear', data.graduationYear);
    formData.append('degreeInstitution', data.degreeInstitution);
    
    if (data.pmdcRegistrationDate) {
      formData.append('pmdcRegistrationDate', data.pmdcRegistrationDate);
    }
    
    // Add all document files with correct field names
    if (data.cnicFront) {
      formData.append('cnicFront', data.cnicFront);
    }
    
    if (data.cnicBack) {
      formData.append('cnicBack', data.cnicBack);
    }
    
    if (data.verificationPhoto) {
      formData.append('verificationPhoto', data.verificationPhoto);
    }
    
    if (data.degreeCertificate) {
      formData.append('degreeCertificate', data.degreeCertificate);
    }
    
    if (data.pmdcCertificate) {
      formData.append('pmdcCertificate', data.pmdcCertificate);
    }

    const response = await fetch(`${API_URL}/api/verification`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit verification');
    }

    return response.json();
  }

  // Get verification status
  async getVerificationStatus(token: string): Promise<VerificationData> {
    const response = await fetch(`${API_URL}/api/verification`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('NOT_FOUND');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch verification status');
    }

    return response.json();
  }

  // Poll verification status (for real-time updates)
  async pollVerificationStatus(
    token: string, 
    onStatusChange: (status: VerificationData) => void,
    interval: number = 30000 // 30 seconds
  ): Promise<() => void> {
    const poll = async () => {
      try {
        const status = await this.getVerificationStatus(token);
        onStatusChange(status);
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    const intervalId = setInterval(poll, interval);
    
    // Return cleanup function
    return () => clearInterval(intervalId);
  }
}

export const verificationAPI = new VerificationAPI();
