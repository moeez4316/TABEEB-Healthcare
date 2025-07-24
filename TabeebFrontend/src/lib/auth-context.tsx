'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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

// Extend the AuthContext type to include token and role
interface AuthContextType {
  user: User | null;
  token: string | null;
  role: string | null;
  loading: boolean;
  roleLoading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchUserRole: () => Promise<void>;
  setUserRole: (role: string) => void;
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
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [roleFetchAttempted, setRoleFetchAttempted] = useState(false);

  const fetchUserRole = async () => {
    if (!token) {
      console.log("[AuthContext] No token available, cannot fetch role from backend.");
      setRoleLoading(false);
      setRoleFetchAttempted(true);
      return;
    }

    console.log("[AuthContext] Fetching role from backend with token");
    setRoleFetchAttempted(true);
    
    try {
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
      
      const userRes = await fetch(`${API_URL}/api/user`, { headers });
      console.log("[AuthContext] User profile status:", userRes.status);

      if(userRes.ok) {
        const userData = await userRes.json();
        const userRole: string = userData.role;
        setRole(userRole);
        localStorage.setItem('role', `${userRole}`);
        console.log(`[AuthContext] ${userRole} profile found`);
        return;

      } else {
        console.log("[AuthContext] No User found");
        setRole('no-role');
        localStorage.removeItem('role');
        return
      }
    } catch (err) {
      console.error("[AuthContext] Error fetching role from backend:", err);
      setRole('no-role');
      localStorage.removeItem('role');
    } finally {
      setRoleLoading(false);
    }
  };

  const setUserRole = (newRole: string) => {
    setRole(newRole);
    localStorage.setItem('role', newRole);
  };

  useEffect(() => {
    console.log("[AuthContext] Initializing auth listener...");
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("[AuthContext] Auth state changed:", !!user);
      
      setUser(user);
      if (user) {
        const token = await user.getIdToken();
        setToken(token);
        
        // 🔥 FIREBASE TOKEN FOR TESTING 🔥
        console.log("🔥 FIREBASE TOKEN FOR POSTMAN:", token);
        console.log("Copy the token above and use it in Postman with Bearer authentication");
        
        // Reset role fetch flag for new auth session
        setRoleFetchAttempted(false);
        
        // Check if role exists in localStorage first
        const cachedRole = localStorage.getItem('role');
        if (cachedRole) {
          console.log("[AuthContext] Found cached role:", cachedRole);
          setRole(cachedRole);
          setRoleFetchAttempted(true); // We have a cached role, no need to fetch
        } else {
          // Only set roleLoading if no cached role
          console.log("[AuthContext] No cached role, will fetch from backend");
          setRole(null);
        }
      } else {
        setToken(null);
        setRole(null);
        setRoleLoading(false);
        setRoleFetchAttempted(false);
        localStorage.removeItem('role');
      }
      
      setLoading(false);
      setAuthInitialized(true);
    });

    return unsubscribe;
  }, []);

  // Fetch role when token becomes available and no cached role exists
  useEffect(() => {
    if (authInitialized && token && !role && !roleLoading && !roleFetchAttempted) {
      console.log("[AuthContext] Starting role fetch...");
      setRoleLoading(true);
      fetchUserRole();
    }
  }, [authInitialized, token, role, roleLoading, roleFetchAttempted]);

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
      // Clear role from localStorage on logout
      localStorage.removeItem('role');
      console.log('[TABEEB DEBUG] Cleared localStorage.role on signOut');
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    role,
    loading,
    roleLoading,
    signUp,
    signIn,
    signInWithGoogle,
    resetPassword,
    signOut,
    fetchUserRole,
    setUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
