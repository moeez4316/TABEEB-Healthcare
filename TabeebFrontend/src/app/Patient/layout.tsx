import Sidebar from "@/components/Sidebar";
import RouteGuard from "@/components/RouteGuard";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireAuth={true}>
      <div style={{ display: "flex" }}>
        <Sidebar />
        <main style={{ flex: 1, padding: 1 }}>{children}</main>
      </div>
    </RouteGuard>
  );
}
