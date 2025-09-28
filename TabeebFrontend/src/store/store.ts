import { configureStore } from '@reduxjs/toolkit'
import patientReducer from './slices/patientSlice'
import doctorReducer from './slices/doctorSlice'

export const store = configureStore({
  reducer: {
    patient: patientReducer,
    doctor: doctorReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch