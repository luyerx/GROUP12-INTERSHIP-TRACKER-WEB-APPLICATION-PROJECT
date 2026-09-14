import Sidebar from "./Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl px-5 py-7 sm:px-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
