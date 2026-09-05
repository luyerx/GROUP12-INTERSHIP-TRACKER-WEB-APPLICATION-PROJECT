"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  ChevronLeft,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";

const items = [
  [
    "Overview",
    "/admin/dashboard",
    BarChart3,
  ],
  [
    "Users",
    "/admin/users",
    Users,
  ],
  [
    "Opportunities",
    "/admin/opportunities",
    BriefcaseBusiness,
  ],
  [
    "Resources",
    "/admin/resources",
    BookOpen,
  ],
] as const;

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to log out."
        );
      }

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  };

  return (
    <aside className="flex border-b border-slate-200 bg-slate-950 text-white lg:min-h-screen lg:w-60 lg:flex-col lg:border-b-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
          <ShieldCheck className="h-4 w-4" />
        </div>

        <div>
          <Link
            href="/admin/dashboard"
            className="text-sm font-semibold"
          >
            Internship Tracker
          </Link>

          <p className="mt-0.5 text-xs text-slate-400">
            Administration
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:block lg:space-y-1">
        {items.map(
          ([label, href, Icon]) => {
            const active =
              pathname === href ||
              pathname.startsWith(
                `${href}/`
              );

            return (
              <Link
                key={href}
                href={href}
                className={
                  active
                    ? "flex items-center gap-2.5 whitespace-nowrap rounded-md bg-white px-3 py-2.5 text-sm font-medium text-slate-950"
                    : "flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
                }
              >
                <Icon className="h-4 w-4" />

                {label}
              </Link>
            );
          }
        )}
      </nav>

      {/* Desktop footer actions */}
      <div className="mx-5 mt-auto hidden border-t border-slate-800 pb-5 pt-5 lg:block">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          <ChevronLeft className="h-3.5 w-3.5" />

          Return to student view
        </Link>

        <button
          type="button"
          onClick={() =>
            void handleLogout()
          }
          className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />

          Log out
        </button>
      </div>
    </aside>
  );
}