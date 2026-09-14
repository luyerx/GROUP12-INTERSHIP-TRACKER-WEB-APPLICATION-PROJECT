import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import Workspace from "@/components/opportunities/Workspace";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login");
  if (user.role !== "employee")
    redirect(user.role === "admin" ? "/admin/dashboard" : "/dashboard");
  return <Workspace>{children}</Workspace>;
}
