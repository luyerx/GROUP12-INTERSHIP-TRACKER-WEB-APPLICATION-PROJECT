import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/auth";

export default async function StudentRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  // Unauthenticated users must sign in first.
  if (!user) {
    redirect("/login");
  }

  // Administrators should use the admin workspace.
  if (user.role !== "student") {
    redirect("/admin/dashboard");
  }

  return <>{children}</>;
}