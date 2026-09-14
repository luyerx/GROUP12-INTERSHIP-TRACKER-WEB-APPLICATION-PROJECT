import Sidebar from "./Sidebar";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="workspace-shell">
      <Sidebar />
      <main id="main-content" tabIndex={-1} className="workspace-main">
        <div className="workspace-content">{children}</div>
      </main>
    </div>
  );
}
