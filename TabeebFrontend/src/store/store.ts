import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage' // localStorage
import patientReducer from './slices/patientSlice'
import doctorReducer from './slices/doctorSlice'
import prescriptionReducer from './slices/prescriptionSlice'

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
}

// Create persisted reducer
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