import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminUsersTable from "@/components/admin/AdminUsersTable";
import { getAuthenticatedUser } from "@/lib/auth";
export default async function Page() {
  const user = await getAuthenticatedUser();
  if (!user) return null;
  return (
    <div>
      <AdminPageHeader
        eyebrow="Account administration"
        title="Users"
        description="Manage student and employee accounts. Only Super Admin can change roles and manage administrators."
      />

      <AdminUsersTable currentUserId={user.id} canManageRoles={user.role === "superadmin"} />
    </div>
  );
}
