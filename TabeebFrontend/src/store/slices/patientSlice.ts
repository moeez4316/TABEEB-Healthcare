import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export interface PatientProfile {
  // Personal Information
  firstName: string
  lastName: string
  email: string
  phone: string
  cnic: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other' | ''
  profileImage?: string

  // Medical Information
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | ''
  height: string // in cm
  weight: string // in kg
  allergies: string[]
  medications: string[]
  medicalConditions: string[]
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }

  // Contact Information
  address: {
    street: string
    city: string
    province: string
    postalCode: string
  }

  // Preferences
  language: string
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
  }
  privacy: {
    shareDataForResearch: boolean
    allowMarketing: boolean
  }
}

// Patient state interface
interface PatientState {
  profile: PatientProfile
  originalProfile: PatientProfile // For tracking unsaved changes
  isLoading: boolean
  error: string | null
  lastSaved: string | null
}

// Default profile
const defaultProfile: PatientProfile = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  cnic: '',
  dateOfBirth: '',
  gender: '',
  profileImage: '',
  bloodType: '',
  height: '',
  weight: '',
  allergies: [],
  medications: [],
  medicalConditions: [],
  emergencyContact: {
    name: '',
    relationship: '',
    phone: ''
  },
  address: {
    street: '',
    city: '',
    province: '',
    postalCode: ''
  },
  language: 'English',
  notifications: {
    email: true,
    sms: true,
    push: true
  },
  privacy: {
    shareDataForResearch: false,
    allowMarketing: false
  }
}

// Initial state
const initialState: PatientState = {
  profile: defaultProfile,
  originalProfile: defaultProfile,
  isLoading: false,
  error: null,
  lastSaved: null,
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper function to get auth token


// Async thunk for creating patient profile
export const createPatientProfile = createAsyncThunk(
  'patient/createProfile',
  async ({ profileData, token }: { profileData: PatientProfile; token: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/patient`, {
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
export const savePatientProfile = createAsyncThunk(
  'patient/saveProfile',
  async ({ profileData, token }: { profileData: PatientProfile; token: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/patient`, {
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
export const loadPatientProfile = createAsyncThunk(
  'patient/loadProfile',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/patient`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Patient profile doesn't exist yet, return default profile
          return defaultProfile;
        }
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to load profile');
      }

      const profileData = await response.json();
      return profileData;
    } catch {
      return rejectWithValue('Network error: Failed to load profile');
    }
  }
);

// Async thunk for uploading profile image
export const uploadProfileImage = createAsyncThunk(
  'patient/uploadProfileImage',
  async ({ file, token }: { file: File; token: string }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await fetch(`${API_URL}/api/patient/profile-image`, {
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
    } catch {
      return rejectWithValue('Network error: Failed to upload image');
    }
  }
);

const patientSlice = createSlice({
  name: 'patient',
  initialState,
  reducers: {
    updateProfile: (state, action: PayloadAction<Partial<PatientProfile>>) => {
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
      .addCase(createPatientProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createPatientProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.profile = action.payload.profile
        state.originalProfile = action.payload.profile
        state.lastSaved = action.payload.timestamp
        state.error = null
      })
      .addCase(createPatientProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Save profile cases
      .addCase(savePatientProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(savePatientProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.profile = action.payload.profile
        state.originalProfile = action.payload.profile
        state.lastSaved = action.payload.timestamp
        state.error = null
      })
      .addCase(savePatientProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Load profile cases
      .addCase(loadPatientProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loadPatientProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.profile = action.payload
        state.originalProfile = action.payload
        state.error = null
      })
      .addCase(loadPatientProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      
      // Upload profile image cases
      .addCase(uploadProfileImage.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(uploadProfileImage.fulfilled, (state, action) => {
        state.isLoading = false
        state.profile.profileImage = action.payload
        state.error = null
      })
      .addCase(uploadProfileImage.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { updateProfile, clearError, resetProfile } = patientSlice.actions

export const selectPatientProfile = (state: { patient: PatientState }) => state.patient.profile
export const selectIsLoading = (state: { patient: PatientState }) => state.patient.isLoading
export const selectError = (state: { patient: PatientState }) => state.patient.error
export const selectLastSaved = (state: { patient: PatientState }) => state.patient.lastSaved

// Check if there are unsaved changes
export const selectHasUnsavedChanges = (state: { patient: PatientState }) => 
  JSON.stringify(state.patient.profile) !== JSON.stringify(state.patient.originalProfile)

export default patientSlice.reducer