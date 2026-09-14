import AdminAddButton from "@/components/admin/AdminAddButton";
import AdminContentTable from "@/components/admin/AdminContentTable";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
export default function Page() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Shared career content"
        title="Resources"
        description="Organise guides, templates, videos, and the categories used to help students prepare."
        action={<AdminAddButton kind="resource" />}
      />
      <AdminContentTable kind="resources" />
    </div>
  );
}
