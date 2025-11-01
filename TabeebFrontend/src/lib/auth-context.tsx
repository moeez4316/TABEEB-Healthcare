'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from './firebase';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Verification status type
type VerificationStatus = 'not-submitted' | 'pending' | 'approved' | 'rejected' | null;

// Extended AuthContext type to include verification
interface AuthContextType {
  user: User | null;
  token: string | null;
  role: string | null;
  verificationStatus: VerificationStatus;
  loading: boolean;
  roleLoading: boolean;
  verificationLoading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUpWithPhone: (phone: string, password: string) => Promise<void>;
  signInWithPhonePassword: (phone: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUserRole: () => Promise<void>;
  setUserRole: (role: string) => void;
  fetchVerificationStatus: () => Promise<void>;
  refreshVerificationStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Phone Auth with Password (no OTP)
  const signUpWithPhone = async (phone: string, password: string): Promise<void> => {
    try {
      // Convert phone number to email format for Firebase
      const phoneEmail = `${phone.replace(/[^0-9+]/g, '')}@tabeeb.phone`;
      const result = await createUserWithEmailAndPassword(auth, phoneEmail, password);
      await updateProfile(result.user, {
        displayName: phone, // Store phone as display name
      });
      setUser({ ...result.user, displayName: phone });
      const token = await result.user.getIdToken();
      setToken(token);
    } catch (error) {
      throw error;
    }
  };

  const signInWithPhonePassword = async (phone: string, password: string): Promise<void> => {
    try {
      // Convert phone number to email format for Firebase
      const phoneEmail = `${phone.replace(/[^0-9+]/g, '')}@tabeeb.phone`;
      const result = await signInWithEmailAndPassword(auth, phoneEmail, password);
      const token = await result.user.getIdToken();
      setToken(token);
    } catch (error) {
      throw error;
    }
  };

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [roleLoading, setRoleLoading] = useState<boolean>(false);
  const [verificationLoading, setVerificationLoading] = useState<boolean>(false);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [roleFetchAttempted, setRoleFetchAttempted] = useState<boolean>(false);

  // Fetch verification status for doctors
  const fetchVerificationStatus = useCallback(async () => {
    if (!token || role !== 'doctor') {
      setVerificationStatus(null);
      setVerificationLoading(false);
      return;
    }

    setVerificationLoading(true);
    
    try {
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      
      const verificationRes = await fetch(`${API_URL}/api/verification`, { headers });
      
      if (verificationRes.ok) {
        const verificationData = await verificationRes.json();
        
        // Use the status field from backend, or derive from isVerified if status is missing
        let status: VerificationStatus;
        if (verificationData.status) {
          status = verificationData.status as VerificationStatus;
        } else {
          // Fallback logic for older data without status field
          status = verificationData.isVerified ? 'approved' : 'pending';
        }
        
        setVerificationStatus(status);
        // Cache verification status in localStorage
        if (status) {
          localStorage.setItem('verificationStatus', status);
        }
      } else if (verificationRes.status === 404) {
        // No verification submitted yet
        setVerificationStatus('not-submitted');
        localStorage.setItem('verificationStatus', 'not-submitted');
      } else {
        // Default to 'not-submitted' for other errors (500, etc.)
        setVerificationStatus('not-submitted');
        localStorage.setItem('verificationStatus', 'not-submitted');
      }
    } catch {
      // Default to 'not-submitted' if there's an error fetching status
      // This ensures the user can still access the verification form
      setVerificationStatus('not-submitted');
      localStorage.setItem('verificationStatus', 'not-submitted');
    } finally {
      setVerificationLoading(false);
    }
  }, [token, role]);

  // Refresh verification status (for polling or after submission)
  const refreshVerificationStatus = async () => {
    localStorage.removeItem('verificationStatus');
    await fetchVerificationStatus();
  };

  const fetchUserRole = useCallback(async () => {
    if (!token) {
      setRoleLoading(false);
      setRoleFetchAttempted(true);
      return;
    }

    setRoleFetchAttempted(true);
    
    try {
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      
      const userRes = await fetch(`${API_URL}/api/user`, { headers });

      if(userRes.ok) {
        const userData = await userRes.json();
        const userRole: string = userData.role;
        setRole(userRole);
        localStorage.setItem('role', `${userRole}`);
        return;

      } else {
        setRole('no-role');
        localStorage.removeItem('role');
        return
      }
    } catch {
      setRole('no-role');
      localStorage.removeItem('role');
    } finally {
      setRoleLoading(false);
    }
  }, [token]);

  const setUserRole = (newRole: string) => {
    setRole(newRole);
    localStorage.setItem('role', newRole);
  };

  useEffect(() => {
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const token = await user.getIdToken();
        setToken(token);
        
        // Reset role fetch flag for new auth session
        setRoleFetchAttempted(false);
        
        // Check if role exists in localStorage first
        const cachedRole = localStorage.getItem('role');
        if (cachedRole) {
          setRole(cachedRole);
          setRoleFetchAttempted(true); // We have a cached role, no need to fetch
          
          // If role is doctor, also check for cached verification status
          if (cachedRole === 'doctor') {
            const cachedVerificationStatus = localStorage.getItem('verificationStatus') as VerificationStatus;
            if (cachedVerificationStatus) {
              setVerificationStatus(cachedVerificationStatus);
            }
          }
        } else {
          // Only set roleLoading if no cached role
          setRole(null);
        }
      } else {
        setToken(null);
        setRole(null);
        setVerificationStatus(null); // Clear verification status when user is null
        setRoleLoading(false);
        setRoleFetchAttempted(false);
        localStorage.removeItem('role');
        localStorage.removeItem('verificationStatus');
      }
      
      setLoading(false);
      setAuthInitialized(true);
    });

    return unsubscribe;
  }, []);

  // Fetch role when token becomes available and no cached role exists
  useEffect(() => {
    if (authInitialized && token && !role && !roleLoading && !roleFetchAttempted) {
      setRoleLoading(true);
      fetchUserRole();
    }
  }, [authInitialized, token, role, roleLoading, roleFetchAttempted, fetchUserRole]);

  // Reset verification status when user changes (different UID) - only for actual user changes
  useEffect(() => {
    // Only reset if we had a previous user and now have a different user
    // Don't reset on initial load or same user navigation
    const currentUid = user?.uid;
    const storedUid = localStorage.getItem('lastUserUid');
    
    if (storedUid && currentUid && storedUid !== currentUid) {
      setVerificationStatus(null);
      localStorage.removeItem('verificationStatus');
    }
    
    if (currentUid) {
      localStorage.setItem('lastUserUid', currentUid);
    } else {
      localStorage.removeItem('lastUserUid');
    }
  }, [user?.uid]);

  // Fetch verification status when user becomes a doctor
  useEffect(() => {
    if (authInitialized && token && role === 'doctor' && verificationStatus === null && !verificationLoading) {
      fetchVerificationStatus();
    }
  }, [authInitialized, token, role, verificationStatus, verificationLoading, fetchVerificationStatus]);

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, {
        displayName: displayName,
      });
      setUser({ ...result.user, displayName });

      const token = await result.user.getIdToken();
      setToken(token);
    } catch (error) {
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      setToken(token);
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      setToken(token);
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setToken(null);
      setRole(null);
      setVerificationStatus(null); // Clear verification status on logout
      // Clear role from localStorage on logout
      localStorage.removeItem('role');
      localStorage.removeItem('verificationStatus');
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    role,
    verificationStatus,
    loading,
    roleLoading,
    verificationLoading,
    signUp,
    signIn,
    signInWithGoogle,
    signUpWithPhone,
    signInWithPhonePassword,
    resetPassword,
    signOut,
    fetchUserRole,
    setUserRole,
    fetchVerificationStatus,
    refreshVerificationStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
