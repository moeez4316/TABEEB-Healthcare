'use client';

import { useAuth } from '../lib/auth-context';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      // Always fetch role from backend using token (Firebase UID)
      const checkRole = async () => {
        if (!token) {
          console.log("[Root] No token available, cannot fetch role from backend.");
          return;
        }
        console.log("[Root] Checking backend for role with token:", token);
        try {
          const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
          // Try doctor profile first
          const doctorRes = await fetch(`${API_URL}/api/doctor`, { headers });
          console.log("[Root] Doctor profile status:", doctorRes.status);
          if (doctorRes.ok) {
            localStorage.setItem('role', 'doctor');
            console.log("[Root] Doctor profile found, redirecting to Doctor/Dashboard");
            router.replace('/Doctor/Dashboard');
            return;
          }
          // Only try patient if doctor is not found
          if (doctorRes.status === 404) {
            const patientRes = await fetch(`${API_URL}/api/patient`, { headers });
            console.log("[Root] Patient profile status:", patientRes.status);
            if (patientRes.ok) {
              localStorage.setItem('role', 'patient');
              console.log("[Root] Patient profile found, redirecting to Patient/dashboard");
              router.replace('/Patient/dashboard');
              return;
            }
            if (patientRes.status === 404) {
              console.log("[Root] No profile found, redirecting to select-role");
              router.replace('/select-role');
              return;
            }
          }
          // If any other error, go to select-role
          console.log("[Root] Error or unknown status, redirecting to select-role");
          router.replace('/select-role');
        } catch (err) {
          console.error("[Root] Error fetching role from backend:", err);
          router.replace('/select-role');
        }
      };
      checkRole();
    } else {
      router.replace('/landing-page');
    }
  }, [user, token, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
