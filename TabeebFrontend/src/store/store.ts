import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer, createTransform } from 'redux-persist'
import storage from './storage' // Custom storage that handles SSR
import patientReducer from './slices/patientSlice'
import doctorReducer from './slices/doctorSlice'
import prescriptionReducer from './slices/prescriptionSlice'

// Transform to prevent base64 images from being persisted
const removeBase64Images = createTransform(
  // inbound: before persisting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (inboundState: any) => {
    if (!inboundState) return inboundState;
    
    const state = { ...inboundState };
    
    // Remove base64 images from profile
    if (state.profile?.profileImage?.startsWith('data:')) {
      state.profile = { ...state.profile, profileImage: '' };
    }
    
    // Remove base64 images from originalProfile
    if (state.originalProfile?.profileImage?.startsWith('data:')) {
      state.originalProfile = { ...state.originalProfile, profileImage: '' };
    }
    
    return state;
  },
  // outbound: when rehydrating (no transformation needed)
  (outboundState) => outboundState,
  // apply to patient and doctor slices
  { whitelist: ['patient', 'doctor'] }
);

// Combine reducers
const rootReducer = combineReducers({
  patient: patientReducer,
  doctor: doctorReducer,
  prescription: prescriptionReducer,
})

// Persist configuration
const persistConfig = {
  key: 'tabeeb-root',
  storage,
  whitelist: ['doctor', 'patient', 'prescription'], // Only persist these reducers
  transforms: [removeBase64Images], // Remove base64 images before persisting
}

// Create persisted reducer
// @ts-expect-error - redux-persist type mismatch with Next.js store types
const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER', 'persist/PURGE'],
      },
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch