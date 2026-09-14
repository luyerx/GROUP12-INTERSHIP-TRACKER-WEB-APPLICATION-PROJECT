import WorkspaceNavigation from "@/components/layout/WorkspaceNavigation";
export default function Workspace({ children }: { children: React.ReactNode }) {
  return (
    <div className="workspace-shell">
      <WorkspaceNavigation role="employee" />
      <main id="main-content" tabIndex={-1} className="workspace-main">
        <div className="workspace-content">{children}</div>
      </main>
    </div>
  );
}
