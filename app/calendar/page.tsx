"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import type { Application } from "@/lib/application";

export default function CalendarPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  useEffect(() => { fetch("/api/applications").then((response) => response.json()).then((result) => setApplications(result.data || [])).catch(() => setApplications([])); }, []);
  const dated = applications.filter((item) => item.deadline).sort((a, b) => a.deadline.localeCompare(b.deadline));
  return <DashboardLayout><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">Schedule</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Application calendar</h1><p className="mt-2 text-sm text-slate-500">Review every upcoming application deadline.</p></div><Link href="/applications/new" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white">Add application</Link></div><section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{dated.length ? <div className="divide-y divide-slate-100">{dated.map((item) => <Link key={item.id} href={`/applications/${item.id}`} className="flex items-center gap-4 py-5 first:pt-0 last:pb-0"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><CalendarDays className="h-5 w-5"/></span><span className="flex-1"><span className="block font-medium text-slate-900">{item.organisation} — {item.roleTitle}</span><span className="mt-1 block text-sm text-slate-500">{item.location || "Location not set"} · {item.status}</span></span><time className="text-sm font-medium text-slate-700">{new Date(`${item.deadline}T00:00:00`).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" })}</time></Link>)}</div> : <p className="py-12 text-center text-sm text-slate-500">No deadlines have been added yet.</p>}</section></DashboardLayout>;
}
