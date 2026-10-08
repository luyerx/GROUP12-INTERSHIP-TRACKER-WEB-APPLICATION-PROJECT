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
        <section className="admin-metrics" aria-label="Platform metrics">
          <dl>{[["Students", stats.students], ["Employees", stats.employees], ["Tracked applications", stats.applications], ["Open opportunities", stats.published], ["Admins", stats.admins], ["Draft opportunities", stats.drafts], ["Published resources", stats.resources]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}<div><dt>AI activity</dt><dd className="metric-entry"><Link href="/admin/ai-usage">View usage ↗</Link></dd></div></dl>
        </section>
      )}
      <section className="operations-overview" aria-labelledby="operations-title">
        <header><p className="eyebrow">Platform management</p><h2 id="operations-title">Keep the essentials in order.</h2><p>Manage accounts, maintain career content and review AI activity from one workspace.</p></header>
        <div className="operations-columns">
          {[{title:"Accounts & activity",number:"01",items:[
            ["Users", "/admin/users", "Review roles, account status and access to the platform.", "Roles · Account status"],
            ["AI Usage", "/admin/ai-usage", "Review usage totals and recent activity metadata.", "Usage · Activity"]
          ]},{title:"Career content",number:"02",items:[
            ["Opportunities", "/admin/opportunities", "Review Employee listings and their publication status.", "Published · Draft · Closed"],
            ["Resources", "/admin/resources", "Maintain useful guides, templates and career preparation materials.", "Categories · Featured content"]
          ]}].map(group => <section className="operations-group" key={group.title}><div className="operations-group-title"><span>{group.number}</span><h3>{group.title}</h3></div>{group.items.map(([title,href,copy,meta]) => <Link className="management-row" key={href} href={href}><div><h4>{title}</h4><p>{copy}</p><span>{meta}</span></div><span aria-hidden="true">↗</span></Link>)}</section>)}
        </div>
      </section>

    </>
  );
}
