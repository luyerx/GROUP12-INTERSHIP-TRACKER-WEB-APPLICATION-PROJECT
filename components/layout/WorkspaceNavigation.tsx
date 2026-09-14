"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  LayoutDashboard,
  Search,
  FolderOpen,
  CalendarDays,
  Sparkles,
  BookOpen,
  UserRound,
  Users,
  Building2,
  Plus,
  Menu,
  X,
  LogOut,
  ArrowUpRight,
} from "lucide-react";
type Role = "student" | "employee" | "admin";
const navigation = {
  student: [
    ["Overview", "/dashboard", LayoutDashboard],
    ["Opportunities", "/opportunities", Search],
    ["My Applications", "/applications", FolderOpen],
    ["Calendar", "/calendar", CalendarDays],
    ["AI Assistant", "/ai-assistant", Sparkles],
    ["Resources", "/resources", BookOpen],
    ["Profile", "/profile", UserRound],
  ],
  employee: [
    ["Overview", "/employee/dashboard", LayoutDashboard],
    ["My Opportunities", "/employee/opportunities", BriefcaseBusiness],
    ["Create Opportunity", "/employee/opportunities/new", Plus],
    ["Company Profile", "/employee/profile", Building2],
  ],
  admin: [
    ["Overview", "/admin/dashboard", LayoutDashboard],
    ["Users", "/admin/users", Users],
    ["Opportunities", "/admin/opportunities", BriefcaseBusiness],
    ["Resources", "/admin/resources", BookOpen],
  ],
} as const;
const labels = { student: "Student", employee: "Employee", admin: "Admin" };
export default function WorkspaceNavigation({ role }: { role: Role }) {
  const pathname = usePathname(),
    router = useRouter();
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [name, setName] = useState("");
  const drawer = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (active && j.success) setName(j.user?.fullName || "");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const dialog = drawer.current;
    if (!open || !dialog) return;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [open]);
  async function logout() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.success)
        throw new Error(data.message || "Unable to log out.");
      router.push("/login");
      router.refresh();
    } catch {
      setError("Unable to sign out. Please try again.");
      setBusy(false);
    }
  }
  const items = navigation[role];
  function content(mobile: boolean) {
    return (
      <>
        <div className="nav-brand">
          <Link
            href={items[0][1]}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3"
          >
            <span className="brand-mark">
              <BriefcaseBusiness aria-hidden="true" size={20} />
            </span>
            <span>
              Internship
              <span className="block font-normal text-slate-500 text-xs mt-0.5">
                Tracker
              </span>
            </span>
          </Link>
          {mobile && (
            <button
              aria-label="Close navigation"
              className="icon-button ml-auto"
              onClick={() => setOpen(false)}
            >
              <X size={20} />
            </button>
          )}
        </div>
        <div className="px-5 pt-5 pb-3">
          <p className="eyebrow">
            {role === "student"
              ? "Your career workspace"
              : role === "employee"
                ? "Recruitment workspace"
                : "Administration"}
          </p>
        </div>
        <nav
          aria-label={labels[role] + " navigation"}
          className="space-y-1 px-3"
        >
          {items.map(([label, href, Icon]) => {
            const active =
              pathname === href ||
              (pathname.startsWith(href + "/") &&
                !items.some(
                  (other) => other[1] !== href && pathname === other[1],
                ));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={"nav-item" + (active ? " nav-item-active" : "")}
              >
                <Icon aria-hidden="true" size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-4">
          <div className="nav-help">
            <p className="font-semibold text-slate-800">
              {role === "student"
                ? "A little progress, every day."
                : role === "employee"
                  ? "Make a strong first impression."
                  : "Keep the platform useful."}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              {role === "student"
                ? "Discover a role. Track your next step."
                : role === "employee"
                  ? "Clear role details help students prepare."
                  : "Review accounts and keep shared content current."}
            </p>
            <Link
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-800"
              href={
                role === "student"
                  ? "/opportunities"
                  : role === "employee"
                    ? "/employee/opportunities/new"
                    : "/admin/resources"
              }
              onClick={() => setOpen(false)}
            >
              {role === "student"
                ? "Explore opportunities"
                : role === "employee"
                  ? "Create a listing"
                  : "Review resources"}
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="mt-5 flex items-center gap-3 border-t border-slate-200 pt-4">
            <span className="user-avatar" aria-hidden="true">
              {(name || labels[role])
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0])
                .join("")}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {name || labels[role] + " workspace"}
              </p>
              <p className="text-xs text-slate-500">{labels[role]} account</p>
            </div>
          </div>
          <button
            className="nav-item mt-3 w-full"
            disabled={busy}
            onClick={() => void logout()}
          >
            <LogOut size={17} aria-hidden="true" />
            {busy ? "Signing out…" : "Sign out"}
          </button>
          {error && (
            <p role="alert" className="mt-2 text-xs text-rose-700">
              {error}
            </p>
          )}
        </div>
      </>
    );
  }
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="workspace-sidebar">{content(false)}</aside>
      <div className="mobile-nav">
        <Link
          href={items[0][1]}
          className="flex items-center gap-2 font-semibold"
        >
          <BriefcaseBusiness
            size={20}
            className="text-teal-700"
            aria-hidden="true"
          />
          Internship Tracker
        </Link>
        <button
          className="icon-button"
          aria-label="Open navigation"
          aria-expanded={open}
          aria-controls="workspace-drawer"
          onClick={() => setOpen(true)}
        >
          <Menu size={22} />
        </button>
      </div>
      <dialog
        ref={drawer}
        id="workspace-drawer"
        aria-label={labels[role] + " navigation"}
        className="nav-drawer"
        onCancel={() => setOpen(false)}
        onClick={(e) => {
          if (
            e.target === e.currentTarget &&
            e.clientX > e.currentTarget.getBoundingClientRect().right
          )
            setOpen(false);
        }}
      >
        <div className="flex min-h-full flex-col">{open && content(true)}</div>
      </dialog>
    </>
  );
}
