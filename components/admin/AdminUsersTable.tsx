"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  LoadingState,
  SuccessFeedback,
  EmptyState,
} from "@/components/ui/Feedback";
import { Search } from "lucide-react";

import AdminModal, { fieldClass, labelClass, ModalActions } from "./AdminModal";
import type { AdminUser } from "@/lib/adminTypes";

export default function AdminUsersTable() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");
  const [all, setAll] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");
  const [status, setStatus] = useState("All");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const result: { success: boolean; data?: AdminUser[]; message?: string } =
        await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.message || "Unable to load users.");
      setAll(result.data || []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load users.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const rows = useMemo(
    () =>
      all.filter(
        (row) =>
          `${row.name} ${row.email} ${row.programme}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (status === "All" || row.status === status) &&
          (role === "All" || row.role === role),
      ),
    [all, query, status, role],
  );

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const data = new FormData(event.currentTarget);
      const response = await fetch(`/api/admin/users/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programme: String(data.get("programme")),
          role: String(data.get("role")),
          status: String(data.get("status")),
        }),
      });
      const result: { success: boolean; message?: string } =
        await response.json();
      if (!response.ok || !result.success) {
        setError(result.message || "Unable to update user.");
        return;
      }
      setEditing(null);
      await load();
      setSuccess("User account updated.");
    } catch {
      setError("Unable to update user. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!editing || !confirm(`Delete ${editing.name}'s account?`)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/users/${editing.id}`, {
        method: "DELETE",
      });
      const result: { success: boolean; message?: string } =
        await response.json();
      if (!response.ok || !result.success) {
        setError(result.message || "Unable to delete user.");
        return;
      }
      setEditing(null);
      await load();
      setSuccess("User deleted.");
    } catch {
      setError("Unable to delete user. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!loading && !error && (
        <section
          aria-label="User roles"
          className="mt-6 grid gap-3 sm:grid-cols-3"
        >
          {["Student", "Employee", "Admin"].map((value) => (
            <button
              className="pipeline-tab"
              aria-pressed={role === value}
              key={value}
              onClick={() => setRole(role === value ? "All" : value)}
            >
              <StatusBadge value={value} />
              <strong>
                {all.filter((user) => user.role === value).length}
              </strong>
            </button>
          ))}
        </section>
      )}
      <div className="mt-8 grid gap-3 card p-4 md:grid-cols-[1fr_160px_160px]">
        <label className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <span className="sr-only">Search users</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email, or programme..."
            className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:ring-4 focus:ring-teal-50"
          />
        </label>
        <select
          aria-label="Filter role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="field"
        >
          <option>All</option>
          <option>Student</option>
          <option>Employee</option>
          <option>Admin</option>
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter status"
          className="h-11 rounded-md border border-slate-200 bg-white px-3.5 text-sm font-medium"
        >
          <option>All</option>
          <option>Active</option>
          <option>Suspended</option>
        </select>
      </div>
      {error && !editing && (
        <p role="alert" className="mt-4 text-sm text-rose-600">
          {error}{" "}
          <button className="btn-secondary" onClick={() => void load()}>
            Retry
          </button>
        </p>
      )}
      {success && (
        <div className="mt-4">
          <SuccessFeedback>{success}</SuccessFeedback>
        </div>
      )}
      {loading && (
        <div className="mt-4">
          <LoadingState label="Loading users…" />
        </div>
      )}
      {!loading && !error && rows.length === 0 && (
        <div className="mt-4">
          <EmptyState
            title="No matching users"
            description="Try another name, role or account status."
            action={
              <button
                className="btn-secondary"
                onClick={() => {
                  setQuery("");
                  setRole("All");
                  setStatus("All");
                }}
              >
                Clear filters
              </button>
            }
          />
        </div>
      )}
      <p className="mt-5 text-sm font-medium text-slate-700">
        {rows.length} users
      </p>
      <section className="mt-3 overflow-hidden card">
        <div
          className="overflow-x-auto"
          role="region"
          aria-label="User accounts table, scroll horizontally for more columns"
          tabIndex={0}
        >
          <table className="w-full min-w-225 text-left">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {[
                  "User",
                  "Programme",
                  "Role",
                  "Status",
                  "Joined",
                  "Action",
                ].map((heading) => (
                  <th
                    key={heading}
                    className={`px-5 py-3.5 ${heading === "Action" ? "text-right" : ""}`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {row.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{row.email}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {row.programme}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    <StatusBadge value={row.role} />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge value={row.status} />
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {row.joined}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      aria-label={"Manage " + row.name}
                      onClick={() => setEditing(row)}
                      className="text-sm font-medium text-slate-600 hover:text-slate-950"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {editing && (
        <AdminModal
          title="Manage user"
          description={`Update ${editing.name}'s account.`}
          onClose={() => {
            if (!busy) setEditing(null);
          }}
        >
          <form onSubmit={(event) => void save(event)}>
            <fieldset disabled={busy}>
              <div className="grid gap-5 p-5">
                <label className={labelClass}>
                  Programme
                  <input
                    name="programme"
                    defaultValue={editing.programme}
                    className={fieldClass}
                  />
                </label>
                <label className={labelClass}>
                  Role
                  <select
                    name="role"
                    defaultValue={editing.role}
                    className={fieldClass}
                  >
                    <option>Student</option>
                    <option>Employee</option>
                    <option>Admin</option>
                  </select>
                </label>
                <label className={labelClass}>
                  Status
                  <select
                    name="status"
                    defaultValue={editing.status}
                    className={fieldClass}
                  >
                    <option>Active</option>
                    <option>Suspended</option>
                  </select>
                </label>
              </div>
              {error && (
                <p role="alert" className="px-5 pb-3 text-rose-700">
                  {error}
                </p>
              )}
              <ModalActions
                onCancel={() => setEditing(null)}
                onDelete={() => void remove()}
              />
            </fieldset>
          </form>
        </AdminModal>
      )}
    </>
  );
}
