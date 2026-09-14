import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminUsersTable from "@/components/admin/AdminUsersTable";
export default function Page() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Account administration"
        title="Users"
        description="Manage Student, Employee and Admin accounts. Only an existing admin can grant Admin access using Manage → Role."
      />

      <AdminUsersTable />
    </div>
  );
}
