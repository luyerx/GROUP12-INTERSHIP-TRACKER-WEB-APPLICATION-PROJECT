"use client";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import { LoadingState, ErrorState } from "@/components/ui/Feedback";
import { useEffect, useState } from "react";
type Stats = {
  students: number;
  employees: number;
  admins: number;
  applications: number;
  published: number;
  drafts: number;
  resources: number;
};
export default function Page() {
  const [stats, setStats] = useState<Stats | null>(null),
    [error, setError] = useState("");
  async function load() {
    setError("");
    try {
      const r = await fetch("/api/admin/stats", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || "Unable to load statistics.");
      setStats(j.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load statistics.");
    }
  }
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, []);
  return (
    <>
      <PageHeader
        eyebrow="System management"
        title="Admin Dashboard"
        description="Oversee accounts, shared opportunities and career resources."
      />
      {error ? (
        <div className="mt-6">
          <ErrorState message={error} retry={() => void load()} />
        </div>
      ) : !stats ? (
        <div className="mt-6">
          <LoadingState label="Loading platform statistics…" />
        </div>
      ) : (
        <div className="my-7 grid gap-6 lg:grid-cols-2">
          {[
            { title: "People", copy: "Accounts across your platform", items: [["Students", stats.students], ["Employees", stats.employees], ["Admins", stats.admins]] },
            { title: "Content & activity", copy: "Listings, resources and student tracking", items: [["Tracked applications", stats.applications], ["Open opportunities", stats.published], ["Draft opportunities", stats.drafts], ["Published resources", stats.resources]] },
          ].map(group => <section className="panel" key={group.title}><p className="eyebrow">{group.title}</p><h2 className="mt-2 text-base font-semibold">{group.copy}</h2><dl className="mt-5 grid grid-cols-2 gap-5">{group.items.map(([label,value]) => <div className="border-t border-slate-200 pt-3" key={label}><dt className="text-sm text-slate-600">{label}</dt><dd className="mt-2 text-3xl font-semibold tabular-nums">{value}</dd></div>)}</dl></section>)}
        </div>
      )}
      <section className="grid gap-4 md:grid-cols-3">
        {[
          [
            "Users",
            "/admin/users",
            "Review roles and account status. Admin access is granted here.",
          ],
          [
            "Opportunities",
            "/admin/opportunities",
            "Manage listings across all employees and administrators.",
          ],
          [
            "Resources",
            "/admin/resources",
            "Maintain guides, templates and career preparation resources.",
          ],
          [
            "AI Usage",
            "/admin/ai-usage",
            "Review Gemini usage totals, recent activity and user-level AI request counts.",
          ],
        ].map(([title, href, copy]) => (
          <Link key={href} href={href} className="panel hover:border-teal-400">
            <h2 className="text-lg font-semibold">{title} →</h2>
            <p className="mt-3 text-sm text-slate-600">{copy}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
