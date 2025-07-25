import SidebarDoctor from "@/components/SidebarDoctor";
import RouteGuard from "@/components/RouteGuard";
import VerificationGuard from "@/components/VerificationGuard";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireAuth={true} allowedRoles={['doctor']}>
      <VerificationGuard>
        <div style={{ display: "flex" }}>
          <SidebarDoctor />
          <main style={{ flex: 1, padding: 1 }}>{children}</main>
        </div>
      </VerificationGuard>
    </RouteGuard>
  );
}
