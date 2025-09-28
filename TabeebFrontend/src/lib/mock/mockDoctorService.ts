// Mock Doctor Profile Service - Easy Backend Integration Later
import { DoctorProfile } from '@/store/slices/doctorSlice';

// Mock storage key
const MOCK_DOCTOR_PROFILE_KEY = 'tabeeb_mock_doctor_profile';
const MOCK_VERIFICATION_STATUS_KEY = 'tabeeb_mock_verification_status';

// Mock delay utility
const mockDelay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

interface MockDoctorData {
  profile: DoctorProfile;
  verificationStatus: 'not-submitted' | 'pending' | 'approved' | 'rejected';
}

export class MockDoctorService {
  // Get mock data from localStorage or create default
  private getMockData(): MockDoctorData {
    const stored = localStorage.getItem(MOCK_DOCTOR_PROFILE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    // Default mock data
    const defaultMockData: MockDoctorData = {
      profile: {
        // Personal Information
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        cnic: '',
        dateOfBirth: '',
        gender: '',
        profileImage: '',

        // Medical Credentials  
        specialization: '',
        qualification: '',
        pmdcNumber: '',
        experience: '',
        
        // Address Information
        address: {
          street: '',
          city: '',
          province: '',
          postalCode: ''
        },
        
        // Verification Status
        verificationStatus: 'not-submitted',
        documentsUploaded: {
          cnicFront: false,
          cnicBack: false, 
          verificationPhoto: false,
          degreeCertificate: false,
          pmdcCertificate: false
        },

        // Preferences
        notifications: {
          email: true,
          sms: true,
          push: true
        },
        
        privacy: {
          shareDataForResearch: false,
          allowMarketing: false
        },
        
        // Statistics
        stats: {
          totalPatients: Math.floor(Math.random() * 100),
          totalAppointments: Math.floor(Math.random() * 500),
          rating: 4.2 + Math.random() * 0.8, // Random rating between 4.2-5.0
          reviewCount: Math.floor(Math.random() * 50),
          completedAppointments: Math.floor(Math.random() * 400)
        }
      },
      verificationStatus: 'not-submitted'
    };

    this.saveMockData(defaultMockData);
    return defaultMockData;
  }

  private saveMockData(data: MockDoctorData) {
    localStorage.setItem(MOCK_DOCTOR_PROFILE_KEY, JSON.stringify(data));
  }

  // Mock API methods that mirror the real backend interface
  async loadDoctorProfile(token: string): Promise<DoctorProfile> {
    await mockDelay();
    console.log('🎭 [MOCK] Loading doctor profile...');
    
    const mockData = this.getMockData();
    return { ...mockData.profile };
  }

  async saveDoctorProfile(profileData: DoctorProfile, token: string): Promise<{ profile: DoctorProfile; timestamp: string }> {
    await mockDelay(800); // Simulate longer save time
    console.log('🎭 [MOCK] Saving doctor profile...', profileData);

    const mockData = this.getMockData();
    const updatedData: MockDoctorData = {
      ...mockData,
      profile: {
        ...profileData,
        // Preserve stats and verification status
        stats: mockData.profile.stats,
        verificationStatus: mockData.profile.verificationStatus,
        documentsUploaded: mockData.profile.documentsUploaded
      }
    };
    
    this.saveMockData(updatedData);

    return {
      profile: updatedData.profile,
      timestamp: new Date().toISOString()
    };
  }

  async uploadDoctorProfileImage(file: File, token: string): Promise<{ imageUrl: string }> {
    await mockDelay(1200); // Simulate image upload time
    console.log('🎭 [MOCK] Uploading doctor profile image...', file);

    // In real implementation, this would upload to cloud storage
    // For now, we'll just return a mock Unsplash URL
    const mockImageUrl = `https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face`;
    
    return { imageUrl: mockImageUrl };
  }

  // Mock method to simulate getting a "complete" doctor profile for testing
  getDemoProfile(): DoctorProfile {
    return {
      // Personal Information
      firstName: 'Muhammad',
      lastName: 'Taha',
      email: 'dr.taha@example.com',
      phone: '+92 300 1234567',
      cnic: '42101-1234567-8',
      dateOfBirth: '1985-03-15',
      gender: 'male',
      profileImage: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',

      // Medical Credentials  
      specialization: 'Cardiology',
      qualification: 'MBBS, MD Cardiology',
      pmdcNumber: 'PMDC-123456',
      experience: '8',
      
      // Address Information
      address: {
        street: '123 Medical Street',
        city: 'Lahore',
        province: 'Punjab',
        postalCode: '54000'
      },
      
      // Verification Status
      verificationStatus: 'approved',
      documentsUploaded: {
        cnicFront: true,
        cnicBack: true, 
        verificationPhoto: true,
        degreeCertificate: true,
        pmdcCertificate: true
      },

      // Preferences
      notifications: {
        email: true,
        sms: false,
        push: true
      },
      
      privacy: {
        shareDataForResearch: true,
        allowMarketing: false
      },
      
      // Statistics
      stats: {
        totalPatients: 245,
        totalAppointments: 1580,
        rating: 4.8,
        reviewCount: 127,
        completedAppointments: 1490
      }
    };
  }

  // Utility method to switch between empty and demo profile
  async loadDemoProfile(token: string): Promise<void> {
    console.log('🎭 [MOCK] Loading demo profile...');
    const demoProfile = this.getDemoProfile();
    const mockData: MockDoctorData = {
      profile: demoProfile,
      verificationStatus: 'approved'
    };
    this.saveMockData(mockData);
  }

  async clearProfile(): Promise<void> {
    console.log('🎭 [MOCK] Clearing profile...');
    localStorage.removeItem(MOCK_DOCTOR_PROFILE_KEY);
    localStorage.removeItem(MOCK_VERIFICATION_STATUS_KEY);
  }

  // Missing methods referenced by other components
  async submitVerification(data: any, token: string): Promise<{ success: boolean; message: string }> {
    await mockDelay(1000);
    console.log('🎭 [MOCK] Submitting verification...', data);
    
    const mockData = this.getMockData();
    const updatedData: MockDoctorData = {
      ...mockData,
      verificationStatus: 'pending',
      profile: {
        ...mockData.profile,
        verificationStatus: 'pending',
        documentsUploaded: {
          cnicFront: true,
          cnicBack: true,
          verificationPhoto: true,
          degreeCertificate: true,
          pmdcCertificate: true
        }
      }
    };
    
    this.saveMockData(updatedData);
    
    return {
      success: true,
      message: 'Verification documents submitted successfully'
    };
  }

  async updateVerificationStatus(status: 'not-submitted' | 'pending' | 'approved' | 'rejected', token: string): Promise<string> {
    await mockDelay(500);
    console.log('🎭 [MOCK] Updating verification status to:', status);
    
    const mockData = this.getMockData();
    const updatedData: MockDoctorData = {
      ...mockData,
      verificationStatus: status,
      profile: {
        ...mockData.profile,
        verificationStatus: status
      }
    };
    
    this.saveMockData(updatedData);
    
    return status;
  }

  // Mock dev panel methods
  seedSampleData(): void {
    console.log('🎭 [MOCK] Seeding sample data...');
    const demoProfile = this.getDemoProfile();
    const mockData: MockDoctorData = {
      profile: demoProfile,
      verificationStatus: 'approved'
    };
    this.saveMockData(mockData);
  }

  clearMockData(): void {
    console.log('🎭 [MOCK] Clearing mock data...');
    localStorage.removeItem(MOCK_DOCTOR_PROFILE_KEY);
    localStorage.removeItem(MOCK_VERIFICATION_STATUS_KEY);
  }

  async mockAdminAction(action: 'approve' | 'reject', token: string): Promise<void> {
    await mockDelay(800);
    console.log('🎭 [MOCK] Admin action:', action);
    
    const status = action === 'approve' ? 'approved' : 'rejected';
    await this.updateVerificationStatus(status, token);
  }
}

// Singleton instance
export const mockDoctorService = new MockDoctorService();