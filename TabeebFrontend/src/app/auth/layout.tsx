import type { Metadata } from "next";
import "@/app/globals.css";
import { AuthProvider } from "@/lib/auth-context";
import RouteGuard from "@/components/RouteGuard";

export const metadata: Metadata = {
  title: "TABEEB - Auth",
  description: "Authentication for TABEEB platform",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <RouteGuard requireAuth={false} redirectTo="/select-role">
        {children}
      </RouteGuard>
    </AuthProvider>
  );
}
