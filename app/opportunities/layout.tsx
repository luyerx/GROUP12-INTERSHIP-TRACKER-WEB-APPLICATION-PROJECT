import StudentRouteGuard from "@/components/auth/StudentRouteGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <StudentRouteGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </StudentRouteGuard>
  );
}
