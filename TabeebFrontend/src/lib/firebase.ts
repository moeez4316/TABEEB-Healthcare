
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA_Hckp3bh3fjMrr612vR9wnfy9MLBJ94s",
  authDomain: "tabeeb-001.firebaseapp.com",
  projectId: "tabeeb-001",
  storageBucket: "tabeeb-001.appspot.com", 
  messagingSenderId: "546944027373",
  appId: "1:546944027373:web:5ded6a6cf232af895b9ae4",
  measurementId: "G-1SV17LKMPN",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence).catch((error) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error setting auth persistence:', error);
  }
});

export { auth };
