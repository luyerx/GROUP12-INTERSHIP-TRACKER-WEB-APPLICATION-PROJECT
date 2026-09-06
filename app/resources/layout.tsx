import StudentRouteGuard from "@/components/auth/StudentRouteGuard";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentRouteGuard>
      {children}
    </StudentRouteGuard>
  );
}