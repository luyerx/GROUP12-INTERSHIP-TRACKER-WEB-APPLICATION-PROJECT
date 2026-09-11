"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, BriefcaseBusiness, CircleCheckBig, Users } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import BackendNotice from "@/components/admin/BackendNotice";

type Row = { status: string; applications?: number; role?: string; organisation?: string; location?: string };
type User = { status: string };

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [opportunities, setOpportunities] = useState<Row[]>([]);
  const [resources, setResources] = useState<Row[]>([]);
  const [applications, setApplications] = useState(0);

  useEffect(() => {
    const load = async () => {
      const [usersResponse, opportunitiesResponse, resourcesResponse] = await Promise.all([
        fetch("/api/admin/users", { cache: "no-store" }),
        fetch("/api/admin/content?kind=opportunities", { cache: "no-store" }),
        fetch("/api/admin/content?kind=resources", { cache: "no-store" }),
      ]);
      const [usersResult, opportunitiesResult, resourcesResult] = await Promise.all([
        usersResponse.json(), opportunitiesResponse.json(), resourcesResponse.json(),
      ]);
      setUsers(usersResult.data || []);
      setOpportunities(opportunitiesResult.data || []);
      setResources(resourcesResult.data || []);
    };
    void load();
  }, []);

  useEffect(() => {
    fetch("/api/admin/stats", { cache: "no-store" })
      .then((response) => response.json())
      .then((result: { data?: { applications?: number } }) => setApplications(result.data?.applications || 0))
      .catch(() => undefined);
  }, []);

  const stats = [
    { label: "Total users", value: users.length, helper: "Registered accounts", icon: Users },
    { label: "Live opportunities", value: opportunities.filter((row) => row.status === "Published").length, helper: "Accepting applications", icon: BriefcaseBusiness },
    { label: "Published resources", value: resources.filter((row) => row.status === "Published").length, helper: "Shared with students", icon: BookOpen },
    { label: "Tracked applications", value: applications, helper: "Stored application records", icon: CircleCheckBig },
  ];

  return <div>
    <AdminPageHeader eyebrow="System overview" title="Admin dashboard" description="Monitor platform activity and manage the shared content students rely on." action={<div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">Live database data</div>} />
    <BackendNotice />
    <section className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, helper, icon: Icon }) => <div key={label} className="bg-white p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">{helper}</p></div><Icon className="h-4 w-4 text-slate-400" /></div></div>)}</section>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-lg border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-sm font-semibold text-slate-950">Opportunity activity</h2><p className="mt-1 text-xs text-slate-500">Applications across shared listings</p></div><Link href="/admin/opportunities" className="flex items-center gap-1 text-xs font-medium text-slate-600">Manage <ArrowRight className="h-3.5 w-3.5" /></Link></div><div className="divide-y divide-slate-100">{opportunities.map((row, index) => <div key={`${row.role}-${index}`} className="flex items-center justify-between gap-4 px-5 py-4"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-900">{row.role}</p><p className="mt-1 text-xs text-slate-400">{row.organisation} · {row.location}</p></div><div className="text-right"><p className="text-sm font-semibold text-slate-800">{row.applications || 0}</p><p className="text-xs text-slate-400">applications</p></div></div>)}</div></section>
      <section className="rounded-lg border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-semibold text-slate-950">Admin attention</h2><p className="mt-1 text-xs text-slate-500">Items that may need review</p></div><div className="space-y-5 p-5">{[["Suspended users", users.filter((row) => row.status === "Suspended").length], ["Draft opportunities", opportunities.filter((row) => row.status === "Draft").length], ["Draft resources", resources.filter((row) => row.status === "Draft").length]].map(([label, value]) => <div key={String(label)}><div className="flex justify-between text-sm"><span className="font-medium text-slate-700">{label}</span><span className="font-semibold">{value}</span></div><div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 w-1/4 rounded-full bg-slate-500" /></div></div>)}</div></section>
    </div>
  </div>;
}
