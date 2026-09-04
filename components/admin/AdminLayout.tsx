import AdminSidebar from "./AdminSidebar";
export default function AdminLayout({ children }: { children: React.ReactNode }) { return <div className="min-h-screen bg-slate-50 lg:flex"><AdminSidebar /><main className="min-w-0 flex-1"><div className="mx-auto w-full max-w-7xl px-5 py-7 sm:px-8 lg:py-10">{children}</div></main></div>; }
