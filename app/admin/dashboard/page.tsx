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
        <section className="my-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Students", stats.students],
            ["Employees", stats.employees],
            ["Admins", stats.admins],
            ["Tracked applications", stats.applications],
            ["Open opportunities", stats.published],
            ["Draft opportunities", stats.drafts],
            ["Published resources", stats.resources],
          ].map(([label, value]) => (
            <div key={label} className="panel stat-card">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-bold">{value}</p>
            </div>
          ))}
        </section>
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
