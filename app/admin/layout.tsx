import { redirect } from "next/navigation";

import AdminLayout from "@/components/admin/AdminLayout";
import { getAuthenticatedUser } from "@/lib/auth";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();

  // Unauthenticated users must sign in first.
  if (!user) {
    redirect("/login");
  }

  // Only administrators can access admin pages.
  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return <AdminLayout>{children}</AdminLayout>;
}