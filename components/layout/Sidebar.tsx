"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navigationItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Applications", href: "/applications" },
  { label: "Calendar", href: "/calendar" },
  { label: "AI assistant", href: "/ai-assistant" },
  { label: "Resources", href: "/resources" },
  { label: "Profile", href: "/profile" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to log out."
        );
      }

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <aside className="flex border-b border-slate-200 bg-white lg:min-h-screen lg:w-52 lg:flex-col lg:border-b-0 lg:border-r">
      <div className="px-5 py-5">
        <Link
          href="/dashboard"
          className="text-base font-semibold text-slate-950"
        >
          Internship Tracker
        </Link>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:pb-0">
        {navigationItems.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? "block whitespace-nowrap rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-950"
                  : "block whitespace-nowrap rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden border-t border-slate-200 p-3 lg:block">
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}