import AdminSidebar from "./AdminSidebar";
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="workspace-shell admin-workspace">
      <AdminSidebar />
      <main id="main-content" tabIndex={-1} className="workspace-main">
        <div className="workspace-content">{children}</div>
      </main>
    </div>
  );
}
