import SidebarDoctor from "@/components/SidebarDoctor";
import RouteGuard from "@/components/RouteGuard";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireAuth={true} allowedRoles={['doctor']}>
      <div style={{ display: "flex" }}>
        <SidebarDoctor />
        <main style={{ flex: 1, padding: 24 }}>{children}</main>
      </div>
    </RouteGuard>
  );
}
