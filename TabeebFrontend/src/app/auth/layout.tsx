import type { Metadata } from "next";
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
    <RouteGuard requireAuth={false} redirectTo="/">
      {children}
    </RouteGuard>
  );
}
