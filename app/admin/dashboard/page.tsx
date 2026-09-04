import Link from "next/link";
import { ArrowRight, BookOpen, BriefcaseBusiness, CircleCheckBig, Users } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import BackendNotice from "@/components/admin/BackendNotice";
import { adminOpportunities, adminResources, adminUsers } from "@/lib/adminDemoData";

const stats = [
  { label:"Total users", value:adminUsers.length, helper:"4 active accounts", icon:Users },
  { label:"Live opportunities", value:adminOpportunities.filter(x => x.status === "Published").length, helper:"Accepting applications", icon:BriefcaseBusiness },
  { label:"Published resources", value:adminResources.filter(x => x.status === "Published").length, helper:"Across 3 categories", icon:BookOpen },
  { label:"Tracked applications", value:adminOpportunities.reduce((sum,x) => sum + x.applications, 0), helper:"Aggregate demo activity", icon:CircleCheckBig },
];

export default function AdminDashboardPage() { return <div>
  <AdminPageHeader eyebrow="System overview" title="Admin dashboard" description="Monitor platform activity and manage the shared content students rely on." action={<div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">Demo data · 5 Sep 2026</div>} />
  <BackendNotice />
  <section className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({label,value,helper,icon:Icon}) => <div key={label} className="bg-white p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">{helper}</p></div><Icon className="h-4 w-4 text-slate-400" /></div></div>)}</section>
  <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
    <section className="rounded-lg border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-sm font-semibold text-slate-950">Opportunity activity</h2><p className="mt-1 text-xs text-slate-500">Applications across shared listings</p></div><Link href="/admin/opportunities" className="flex items-center gap-1 text-xs font-medium text-slate-600">Manage <ArrowRight className="h-3.5 w-3.5" /></Link></div><div className="divide-y divide-slate-100">{adminOpportunities.map(x => <div key={x.id} className="flex items-center justify-between gap-4 px-5 py-4"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-900">{x.role}</p><p className="mt-1 text-xs text-slate-400">{x.organisation} · {x.location}</p></div><div className="text-right"><p className="text-sm font-semibold text-slate-800">{x.applications}</p><p className="text-xs text-slate-400">applications</p></div></div>)}</div></section>
    <section className="rounded-lg border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-semibold text-slate-950">Admin attention</h2><p className="mt-1 text-xs text-slate-500">Items that may need review</p></div><div className="space-y-5 p-5">{[["Suspended users","1","w-1/5 bg-amber-400"],["Draft opportunities","1","w-1/4 bg-slate-500"],["Draft resources","1","w-1/4 bg-slate-500"]].map(([label,value,width]) => <div key={label}><div className="flex justify-between text-sm"><span className="font-medium text-slate-700">{label}</span><span className="font-semibold">{value}</span></div><div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className={`h-1.5 rounded-full ${width}`} /></div></div>)}</div></section>
  </div>
</div>; }
