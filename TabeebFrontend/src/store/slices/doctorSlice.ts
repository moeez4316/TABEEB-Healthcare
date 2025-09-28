import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { mockDoctorService } from '@/lib/mock/mockDoctorService'
import APP_CONFIG from '@/lib/config/appConfig'

export interface DoctorProfile {
  // Personal Information
  firstName: string
  lastName: string
  email: string
  phone: string
  cnic: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other' | ''
  profileImage?: string

  // Medical Credentials
  specialization: string
  qualification: string
  pmdcNumber: string
  experience: string // in years
  
  // Address Information
  address: {
    street: string
    city: string
    province: string
    postalCode: string
  }
  
  // Verification Status
  verificationStatus: 'not-submitted' | 'pending' | 'approved' | 'rejected'
  documentsUploaded: {
    cnicFront: boolean
    cnicBack: boolean
    verificationPhoto: boolean
    degreeCertificate: boolean
    pmdcCertificate: boolean
  }

  // Preferences
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
  }
  
  privacy: {
    shareDataForResearch: boolean
    allowMarketing: boolean
  }
  
  // Statistics (read-only from backend)
  stats: {
    totalPatients: number
    totalAppointments: number
    rating: number
    reviewCount: number
    completedAppointments: number
  }
}

// Doctor state interface
interface DoctorState {
  profile: DoctorProfile
  originalProfile: DoctorProfile // For tracking unsaved changes
  isLoading: boolean
  error: string | null
  lastSaved: string | null
}

// Default profile
const defaultProfile: DoctorProfile = {
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
    totalPatients: 0,
    totalAppointments: 0,
    rating: 0,
    reviewCount: 0,
    completedAppointments: 0
  }
}

// Initial state
const initialState: DoctorState = {
  profile: defaultProfile,
  originalProfile: defaultProfile,
  isLoading: false,
  error: null,
  lastSaved: null,
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Async thunk for creating doctor profile
export const createDoctorProfile = createAsyncThunk(
  'doctor/createProfile',
  async ({ profileData, token }: { profileData: DoctorProfile; token: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/doctor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to create profile');
      }

      const result = await response.json();
      return {
        profile: profileData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return rejectWithValue('Network error: Failed to create profile');
    }
  }
);

// Async thunk for saving/updating profile
export const saveDoctorProfile = createAsyncThunk(
  'doctor/saveProfile',
  async ({ profileData, token }: { profileData: DoctorProfile; token: string }, { rejectWithValue }) => {
    try {
      // Use mock service if configured
      if (APP_CONFIG.USE_MOCK_BACKEND) {
        return await mockDoctorService.saveDoctorProfile(profileData, token);
      }

      // Real backend implementation
      const response = await fetch(`${API_URL}/api/doctor`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to save profile');
      }

      const result = await response.json();
      return {
        profile: profileData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return rejectWithValue('Network error: Failed to save profile');
    }
  }
);

// Async thunk for loading profile
export const loadDoctorProfile = createAsyncThunk(
  'doctor/loadProfile',
  async (token: string, { rejectWithValue }) => {
    try {
      // Use mock service if configured
      if (APP_CONFIG.USE_MOCK_BACKEND) {
        return await mockDoctorService.loadDoctorProfile(token);
      }

      // Real backend implementation
      const response = await fetch(`${API_URL}/api/doctor`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Doctor profile doesn't exist yet, return default profile
          return defaultProfile;
        }
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to load profile');
      }

      const profileData = await response.json();
      // Merge with default profile to ensure all arrays and objects exist
      return { ...defaultProfile, ...profileData };
    } catch (error) {
      return rejectWithValue('Network error: Failed to load profile');
    }
  }
);

// Async thunk for uploading profile image
export const uploadDoctorProfileImage = createAsyncThunk(
  'doctor/uploadProfileImage',
  async ({ file, token }: { file: File; token: string }, { rejectWithValue }) => {
    try {
      // Use mock service if configured
      if (APP_CONFIG.USE_MOCK_BACKEND) {
        return await mockDoctorService.uploadDoctorProfileImage(file, token);
      }

      // Real backend implementation
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await fetch(`${API_URL}/api/doctor/profile-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to upload image');
      }

      const result = await response.json();
      return result.imageUrl;
    } catch (error) {
      return rejectWithValue('Network error: Failed to upload image');
    }
  }
);

// Async thunk for updating verification status
export const updateVerificationStatus = createAsyncThunk(
  'doctor/updateVerificationStatus',
  async ({ status, token }: { status: DoctorProfile['verificationStatus']; token: string }, { rejectWithValue }) => {
    try {
      // Use mock service if configured
      if (APP_CONFIG.USE_MOCK_BACKEND) {
        return await mockDoctorService.updateVerificationStatus(status, token);
      }

      // Real backend implementation
      const response = await fetch(`${API_URL}/api/doctor/verification-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to update verification status');
      }

      return status;
    } catch (error) {
      return rejectWithValue('Network error: Failed to update verification status');
    }
  }
);

const doctorSlice = createSlice({
  name: 'doctor',
  initialState,
  reducers: {
    updateProfile: (state, action: PayloadAction<Partial<DoctorProfile>>) => {
      state.profile = { ...state.profile, ...action.payload }
    },
    
    clearError: (state) => {
      state.error = null
    },
    
    resetProfile: (state) => {
      state.profile = { ...state.originalProfile }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create profile cases
      .addCase(createDoctorProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createDoctorProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.profile = action.payload.profile
        state.originalProfile = action.payload.profile
        state.lastSaved = action.payload.timestamp
        state.error = null
      })
      .addCase(createDoctorProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Save profile cases
      .addCase(saveDoctorProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(saveDoctorProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.profile = action.payload.profile
        state.originalProfile = action.payload.profile
        state.lastSaved = action.payload.timestamp
        state.error = null
      })
      .addCase(saveDoctorProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Load profile cases
      .addCase(loadDoctorProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loadDoctorProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.profile = action.payload
        state.originalProfile = action.payload
        state.error = null
      })
      .addCase(loadDoctorProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Upload profile image cases
      .addCase(uploadDoctorProfileImage.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(uploadDoctorProfileImage.fulfilled, (state, action) => {
        state.isLoading = false
        state.profile.profileImage = action.payload
        state.error = null
      })
      .addCase(uploadDoctorProfileImage.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Update verification status cases
      .addCase(updateVerificationStatus.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateVerificationStatus.fulfilled, (state, action) => {
        state.isLoading = false
        state.profile.verificationStatus = action.payload as DoctorProfile['verificationStatus']
        state.error = null
      })
      .addCase(updateVerificationStatus.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { updateProfile, clearError, resetProfile } = doctorSlice.actions

export const selectDoctorProfile = (state: { doctor: DoctorState }) => state.doctor.profile
export const selectIsLoading = (state: { doctor: DoctorState }) => state.doctor.isLoading
export const selectError = (state: { doctor: DoctorState }) => state.doctor.error
export const selectLastSaved = (state: { doctor: DoctorState }) => state.doctor.lastSaved

// Check if there are unsaved changes
export const selectHasUnsavedChanges = (state: { doctor: DoctorState }) => 
  JSON.stringify(state.doctor.profile) !== JSON.stringify(state.doctor.originalProfile)

export default doctorSlice.reducer