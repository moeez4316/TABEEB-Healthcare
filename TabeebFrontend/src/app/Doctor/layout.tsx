import SidebarDoctor from "@/components/SidebarDoctor";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex" }}>
      <SidebarDoctor />
      <main style={{ flex: 1, padding: 24 }}>{children}</main>
    </div>
  );
}
