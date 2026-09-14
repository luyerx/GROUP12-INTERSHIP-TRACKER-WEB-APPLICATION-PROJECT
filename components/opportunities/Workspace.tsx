"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
export default function Workspace({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(),
    router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      const r = await fetch("/api/auth/logout", { method: "POST" });
      if (!r.ok) throw new Error();
      router.push("/login");
      router.refresh();
    } catch {
      setError("Unable to sign out. Please retry.");
      setBusy(false);
    }
  }
  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="border-b border-slate-200 bg-white p-5 lg:min-h-screen lg:w-60 lg:shrink-0 lg:border-r">
        <Link href="/employee/dashboard" className="font-bold text-slate-950">
          Internship Tracker
        </Link>
        <p className="eyebrow mb-8 mt-2">Recruitment workspace</p>
        <nav
          aria-label="Employee navigation"
          className="flex gap-2 overflow-x-auto lg:flex-col"
        >
          {[
            ["Dashboard", "/employee/dashboard"],
            ["My Opportunities", "/employee/opportunities"],
            ["Create Opportunity", "/employee/opportunities/new"],
            ["Company Profile", "/employee/profile"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={
                "whitespace-nowrap rounded-lg px-3 py-3 text-sm " +
                (pathname === href
                  ? "bg-teal-50 font-semibold text-teal-800"
                  : "text-slate-600 hover:bg-slate-50")
              }
            >
              {label}
            </Link>
          ))}
        </nav>
        <button
          className="btn-secondary mt-8"
          disabled={busy}
          onClick={() => void logout()}
        >
          Sign out
        </button>
        {error && <p role="alert">{error}</p>}
      </aside>
      <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 p-5 sm:p-8 lg:p-10">
        {children}
      </main>
    </div>
  );
}
