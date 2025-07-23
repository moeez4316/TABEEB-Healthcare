import RouteGuard from "@/components/RouteGuard";

export default function SelectRoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireAuth={true} requireRole={false}>
      {children}
    </RouteGuard>
  );
}
