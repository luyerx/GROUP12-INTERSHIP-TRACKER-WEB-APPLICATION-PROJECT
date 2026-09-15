import Workspace from "@/components/opportunities/Workspace";
import { getAuthenticatedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  if (user.role !== "employee")
    redirect((user.role === "admin" || user.role === "superadmin") ? "/admin/dashboard" : "/dashboard");
  return <Workspace>{children}</Workspace>;
}
