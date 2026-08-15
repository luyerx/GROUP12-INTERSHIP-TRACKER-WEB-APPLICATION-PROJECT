"use client";

import Link from "next/link";

import {
  LayoutDashboard,
  BriefcaseBusiness,
  CalendarDays,
  Sparkles,
  BookOpen,
  UserRound,
  LogOut,
} from "lucide-react";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Applications",
    href: "/applications",
    icon: BriefcaseBusiness,
  },
  {
    label: "Calendar",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    label: "AI Assistant",
    href: "/ai-assistant",
    icon: Sparkles,
  },
  {
    label: "Resources",
    href: "/resources",
    icon: BookOpen,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserRound,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-slate-200 bg-white px-4 py-6">
      <div className="px-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Career Workspace
        </p>

        <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
          Internship Tracker
        </h1>
      </div>

      <nav className="mt-10 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
            key={item.label}
            href={item.href}
            className={
                isActive
                ? "flex items-center gap-3 rounded-xl bg-slate-950 px-3 py-2.5 text-sm font-medium text-white shadow-sm"
                : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950"
            }
            >
            <Icon className="h-4 w-4" strokeWidth={1.8} />
            <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-200 pt-4">
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-rose-50 hover:text-rose-600">
          <LogOut className="h-4 w-4" strokeWidth={1.8} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}