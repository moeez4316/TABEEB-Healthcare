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

// Async thunk for saving profile (currently localStorage, to change to API later)
export const savePatientProfile = createAsyncThunk(
  'patient/saveProfile',
  async (profileData: PatientProfile, { rejectWithValue }) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // For now, save to localStorage (to replace with API call)
      localStorage.setItem('patientProfile', JSON.stringify(profileData))
      
      return {
        profile: profileData,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return rejectWithValue('Failed to save profile')
    }
  }
)

// Async thunk for loading profile
export const loadPatientProfile = createAsyncThunk(
  'patient/loadProfile',
  async (_, { rejectWithValue }) => {
    try {
      const savedProfile = localStorage.getItem('patientProfile')
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile)
        return parsed
      }
      return defaultProfile
    } catch (error) {
      return rejectWithValue('Failed to load profile')
    }
  }
)

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