import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { fetchWithRateLimit } from '@/lib/api-utils'

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
  hourlyConsultationRate: number | null // PKR per hour
  
  // Address Information
  address: {
    street: string
    city: string
    province: string
    postalCode: string
  }
  
  // Verification Status
  verificationStatus: 'not-submitted' | 'pending' | 'approved' | 'rejected'
  isVerified?: boolean
  documentsUploaded: {
    cnicFront: boolean
    cnicBack: boolean
    verificationPhoto: boolean
    degreeCertificate: boolean
    pmdcCertificate: boolean
  }
  
  // Additional verification fields from verification table
  graduationYear?: string
  degreeInstitution?: string
  pmdcRegistrationDate?: string

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
  hourlyConsultationRate: null,
  
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
      // Transform frontend data to backend format
      const backendData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        name: `${profileData.firstName} ${profileData.lastName}`,
        email: profileData.email,
        phone: profileData.phone,
        dateOfBirth: profileData.dateOfBirth,
        gender: profileData.gender,
        specialization: profileData.specialization,
        qualification: profileData.qualification,
        experience: profileData.experience,
        hourlyConsultationRate: profileData.hourlyConsultationRate,
        addressStreet: profileData.address.street,
        addressCity: profileData.address.city,
        addressProvince: profileData.address.province,
        addressPostalCode: profileData.address.postalCode,
        language: 'English',
        notificationsEmail: profileData.notifications.email,
        notificationsSms: profileData.notifications.sms,
        notificationsPush: profileData.notifications.push,
        privacyShareData: profileData.privacy.shareDataForResearch,
        privacyMarketing: profileData.privacy.allowMarketing,
        profileImage: profileData.profileImage
      };

      const response = await fetchWithRateLimit(`${API_URL}/api/doctor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(backendData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to create profile');
      }

      await response.json();
      return {
        profile: profileData,
        timestamp: new Date().toISOString()
      };
    } catch {
      return rejectWithValue('Network error: Failed to create profile');
    }
  }
);

// Async thunk for saving/updating profile
export const saveDoctorProfile = createAsyncThunk(
  'doctor/saveProfile',
  async ({ profileData, token }: { profileData: DoctorProfile; token: string }, { rejectWithValue }) => {
    try {
      // Backend implementation - transform data
      const backendData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        name: `${profileData.firstName} ${profileData.lastName}`,
        email: profileData.email,
        phone: profileData.phone,
        dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString() : null,
        gender: profileData.gender,
        specialization: profileData.specialization,
        qualification: profileData.qualification,
        experience: profileData.experience,
        hourlyConsultationRate: profileData.hourlyConsultationRate,
        addressStreet: profileData.address.street,
        addressCity: profileData.address.city,
        addressProvince: profileData.address.province,
        addressPostalCode: profileData.address.postalCode,
        language: 'English',
        notificationsEmail: profileData.notifications.email,
        notificationsSms: profileData.notifications.sms,
        notificationsPush: profileData.notifications.push,
        privacyShareData: profileData.privacy.shareDataForResearch,
        privacyMarketing: profileData.privacy.allowMarketing,
        profileImage: profileData.profileImage
      };

      const response = await fetchWithRateLimit(`${API_URL}/api/doctor`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(backendData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to save profile');
      }

      await response.json();
      return {
        profile: profileData,
        timestamp: new Date().toISOString()
      };
    } catch {
      return rejectWithValue('Network error: Failed to save profile');
    }
  }
);

// Async thunk for loading profile
export const loadDoctorProfile = createAsyncThunk(
  'doctor/loadProfile',
  async (token: string, { rejectWithValue }) => {
    try {
      // Backend implementation
      const response = await fetchWithRateLimit(`${API_URL}/api/doctor`, {
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

      const backendData = await response.json();
      
      // Transform backend data to frontend format
      const profileData: DoctorProfile = {
        ...defaultProfile,
        firstName: backendData.firstName || '',
        lastName: backendData.lastName || '',
        email: backendData.email || '',
        phone: backendData.phone || '',
        cnic: backendData.cnicNumber || '',
        dateOfBirth: backendData.dateOfBirth ? new Date(backendData.dateOfBirth).toISOString().split('T')[0] : '',
        gender: backendData.gender || '',
        profileImage: backendData.profileImageUrl || '',
        specialization: backendData.specialization || '',
        qualification: backendData.qualification || '',
        pmdcNumber: backendData.pmdcNumber || '',
        experience: backendData.experience || '',
        hourlyConsultationRate: backendData.hourlyConsultationRate !== undefined && backendData.hourlyConsultationRate !== null 
          ? Number(backendData.hourlyConsultationRate) 
          : null,
        address: {
          street: backendData.addressStreet || '',
          city: backendData.addressCity || '',
          province: backendData.addressProvince || '',
          postalCode: backendData.addressPostalCode || ''
        },
        notifications: {
          email: backendData.notificationsEmail !== undefined ? backendData.notificationsEmail : true,
          sms: backendData.notificationsSms !== undefined ? backendData.notificationsSms : true,
          push: backendData.notificationsPush !== undefined ? backendData.notificationsPush : true
        },
        privacy: {
          shareDataForResearch: backendData.privacyShareData || false,
          allowMarketing: backendData.privacyMarketing || false
        },
        verificationStatus: backendData.verificationStatus || 'not-submitted',
        isVerified: backendData.isVerified || false,
        // Additional verification fields from the verification table
        graduationYear: backendData.graduationYear || '',
        degreeInstitution: backendData.degreeInstitution || '',
        pmdcRegistrationDate: backendData.pmdcRegistrationDate || ''
      };
      
      return profileData;
    } catch {
      return rejectWithValue('Network error: Failed to load profile');
    }
  }
);

// Async thunk for uploading profile image using client-side Cloudinary upload
export const uploadDoctorProfileImage = createAsyncThunk(
  'doctor/uploadProfileImage',
  async ({ file, token }: { file: File; token: string }, { rejectWithValue }) => {
    try {
      // Dynamic import to avoid circular dependencies
      const { uploadFile } = await import('@/lib/cloudinary-upload');
      
      // Upload to Cloudinary first
      const uploadResult = await uploadFile(file, 'profile-image', token);

      // Update backend with the publicId
      const response = await fetchWithRateLimit(`${API_URL}/api/doctor/profile-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicId: uploadResult.publicId,
          url: uploadResult.secureUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to update profile image');
      }

      const result = await response.json();
      return result.imageUrl;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to upload image');
    }
  }
);

// Async thunk for fetching verification status
export const fetchVerificationStatus = createAsyncThunk(
  'doctor/fetchVerificationStatus',
  async (token: string, { rejectWithValue }) => {
    try {
      // Backend implementation - get verification status
      const response = await fetchWithRateLimit(`${API_URL}/api/verification`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return 'not-submitted';
        }
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch verification status');
      }

      const verificationData = await response.json();
      return verificationData.status || (verificationData.isVerified ? 'approved' : 'pending');
    } catch {
      return rejectWithValue('Network error: Failed to fetch verification status');
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
      
      // Fetch verification status cases
      .addCase(fetchVerificationStatus.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchVerificationStatus.fulfilled, (state, action) => {
        state.isLoading = false
        state.profile.verificationStatus = action.payload as DoctorProfile['verificationStatus']
        state.error = null
      })
      .addCase(fetchVerificationStatus.rejected, (state, action) => {
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