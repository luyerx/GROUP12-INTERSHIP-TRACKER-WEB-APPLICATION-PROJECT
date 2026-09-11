"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import AdminModal, { fieldClass, labelClass, ModalActions } from "./AdminModal";
import type { AdminUser } from "@/lib/adminTypes";

export default function AdminUsersTable() {
  const [all, setAll] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const result: { success: boolean; data?: AdminUser[]; message?: string } = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to load users.");
      setAll(result.data || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load users.");
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const rows = useMemo(
    () => all.filter((row) => `${row.name} ${row.email} ${row.programme}`.toLowerCase().includes(query.toLowerCase()) && (status === "All" || row.status === status)),
    [all, query, status]
  );

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const data = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/users/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ programme: String(data.get("programme")), role: String(data.get("role")), status: String(data.get("status")) }),
    });
    const result: { success: boolean; message?: string } = await response.json();
    if (!response.ok || !result.success) {
      setError(result.message || "Unable to update user.");
      return;
    }
    setEditing(null);
    await load();
  }

  async function remove() {
    if (!editing || !confirm(`Delete ${editing.name}'s account?`)) return;
    const response = await fetch(`/api/admin/users/${editing.id}`, { method: "DELETE" });
    const result: { success: boolean; message?: string } = await response.json();
    if (!response.ok || !result.success) {
      setError(result.message || "Unable to delete user.");
      return;
    }
    setEditing(null);
    await load();
  }

  return <>
    <div className="mt-8 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1fr_190px]">
      <label className="relative"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><span className="sr-only">Search users</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, or programme..." className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:ring-4 focus:ring-slate-100" /></label>
      <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter status" className="h-11 rounded-md border border-slate-200 bg-white px-3.5 text-sm font-medium"><option>All</option><option>Active</option><option>Suspended</option></select>
    </div>
    {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
    <p className="mt-5 text-sm font-medium text-slate-700">{rows.length} users</p>
    <section className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-225 text-left"><thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr>{["User", "Programme", "Role", "Status", "Joined", "Action"].map((heading) => <th key={heading} className={`px-5 py-3.5 ${heading === "Action" ? "text-right" : ""}`}>{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={row.id} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="text-sm font-semibold text-slate-900">{row.name}</p><p className="mt-0.5 text-xs text-slate-400">{row.email} · {row.id}</p></td><td className="px-5 py-4 text-sm text-slate-600">{row.programme}</td><td className="px-5 py-4 text-sm text-slate-600">{row.role}</td><td className="px-5 py-4"><Badge value={row.status} /></td><td className="px-5 py-4 text-sm text-slate-500">{row.joined}</td><td className="px-5 py-4 text-right"><button onClick={() => setEditing(row)} className="text-sm font-medium text-slate-600 hover:text-slate-950">Manage</button></td></tr>)}</tbody></table></div></section>
    {editing && <AdminModal title="Manage user" description={`Update ${editing.name}'s account.`} onClose={() => setEditing(null)}><form onSubmit={(event) => void save(event)}><div className="grid gap-5 p-5"><label className={labelClass}>Programme<input name="programme" defaultValue={editing.programme} className={fieldClass} /></label><label className={labelClass}>Role<select name="role" defaultValue={editing.role} className={fieldClass}><option>Student</option><option>Admin</option></select></label><label className={labelClass}>Status<select name="status" defaultValue={editing.status} className={fieldClass}><option>Active</option><option>Suspended</option></select></label></div><ModalActions onCancel={() => setEditing(null)} onDelete={() => void remove()} /></form></AdminModal>}
  </>;
}

function Badge({ value }: { value: string }) { return <span className={value === "Active" ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200" : "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200"}>{value}</span>; }
