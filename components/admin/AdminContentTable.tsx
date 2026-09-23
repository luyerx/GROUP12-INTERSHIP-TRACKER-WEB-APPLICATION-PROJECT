"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ErrorState,
  SuccessFeedback,
  LoadingState,
} from "@/components/ui/Feedback";
import { Search } from "lucide-react";

import AdminModal, { fieldClass, labelClass, ModalActions } from "./AdminModal";
import type { AdminOpportunity, AdminResource } from "@/lib/adminTypes";

type Kind = "resources" | "opportunities";
type Row = AdminResource | AdminOpportunity;

export default function AdminContentTable({ kind }: { kind: Kind }) {
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [all, setAll] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [editing, setEditing] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/content?kind=${kind}`, {
        cache: "no-store",
      });
      const result: { success: boolean; data?: Row[]; message?: string } =
        await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.message || "Unable to load content.");
      setAll(result.data || []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load content.",
      );
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const name = `admin:add:${kind === "resources" ? "resource" : "opportunity"}`;
    const open = () =>
      setEditing(
        kind === "resources"
          ? {
              id: "",
              title: "",
              category: "",
              type: "Guide",
              status: "Draft",
              updated: "",
            }
          : {
              id: "",
              organisation: "",
              role: "",
              location: "",
              closingDate: "",
              status: "Draft",
              applications: 0,
            },
      );
    window.addEventListener(name, open);
    return () => window.removeEventListener(name, open);
  }, [kind]);

  const rows = useMemo(
    () =>
      all.filter(
        (row) =>
          JSON.stringify(row).toLowerCase().includes(query.toLowerCase()) &&
          (status === "All" || row.status === status),
      ),
    [all, query, status],
  );

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setSuccess("");
    setBusy(true);
    setError("");
    try {
      const data = new FormData(event.currentTarget);
      const isResource = "title" in editing;
      const body = isResource
        ? {
            title: String(data.get("title")),
            description: String(data.get("description") || ""),
            category: String(data.get("category")),
            type: String(data.get("type")),
            featured: data.get("featured") === "on",
            source: String(data.get("source") || "Internship Tracker"),
            url: String(data.get("url") || ""),
            status: String(data.get("status")),
          }
        : {
            organisation: String(data.get("organisation")),
            role: String(data.get("role")),
            location: String(data.get("location")),
            closingDate: String(data.get("closingDate")),
            status: String(data.get("status")),
          };
      const endpoint = `/api/admin/content${editing.id ? `/${editing.id}` : ""}?kind=${kind}`;
      const response = await fetch(endpoint, {
        method: editing.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result: { success: boolean; message?: string } =
        await response.json();
      if (!response.ok || !result.success) {
        setError(result.message || "Unable to save content.");
        return;
      }
      setEditing(null);
      await load();
      setSuccess("Changes saved.");
    } catch {
      setError("Unable to save content. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy || !editing || !editing.id || !confirm("Delete this item?")) return;
    setSuccess("");
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/content/${editing.id}?kind=${kind}`,
        { method: "DELETE" },
      );
      const result: { success?: boolean; message?: string } =
        await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        setError(result.message || "Unable to delete content. Please retry.");
        return;
      }
      setEditing(null);
      await load();
    } catch {
      setError("Unable to delete content. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Filters
        kind={kind}
        query={query}
        setQuery={setQuery}
        status={status}
        setStatus={setStatus}
      />
      {error && !editing && (
        <div className="mt-4">
          <ErrorState message={error} retry={() => void load()} />
        </div>
      )}
      {success && (
        <div className="mt-4">
          <SuccessFeedback>{success}</SuccessFeedback>
        </div>
      )}
      {loading && (
        <div className="mt-4">
          <LoadingState label="Loading shared content…" />
        </div>
      )}
      <p className="mt-5 text-sm font-medium text-slate-700">
        {loading ? "Loading..." : `${rows.length} ${kind}`}
      </p>
      {!loading && !error && rows.length === 0 && (
        <p className="panel mt-4" role="status">
          No matching content. Create a resource or adjust your filters.
        </p>
      )}
      <section className="mt-3 overflow-hidden card">
        <div
          className="overflow-x-auto"
          tabIndex={0}
          role="region"
          aria-label="Shared content table, scroll horizontally for more columns"
        >
          <table className="w-full min-w-200 text-left">
            {kind === "resources" ? (
              <ResourceRows rows={rows as AdminResource[]} edit={setEditing} />
            ) : (
              <OpportunityRows
                rows={rows as AdminOpportunity[]}
                edit={setEditing}
              />
            )}
          </table>
        </div>
      </section>
      {editing && (
        <AdminModal
          title={`${editing.id ? "Edit" : "Add"} ${"title" in editing ? "resource" : "opportunity"}`}
          description={
            editing.id ? `Update ${editing.id}.` : "Create a new shared item."
          }
          onClose={() => {
            if (!busy) setEditing(null);
          }}
        >
          <form onSubmit={(event) => void save(event)}>
            <fieldset disabled={busy}>
              <div className="grid gap-5 p-5 sm:grid-cols-2">
                {"title" in editing ? (
                  <ResourceForm row={editing} />
                ) : (
                  <OpportunityForm row={editing} />
                )}
              </div>
              {error && (
                <p role="alert" className="px-5 pb-3 text-rose-700">
                  {error}
                </p>
              )}
              <ModalActions
                onCancel={() => setEditing(null)}
                onDelete={editing.id ? () => void remove() : undefined}
              />
            </fieldset>
          </form>
        </AdminModal>
      )}
    </>
  );
}

function Filters({
  kind,
  query,
  setQuery,
  status,
  setStatus,
}: {
  kind: string;
  query: string;
  setQuery: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
}) {
  return (
    <div className="mt-8 grid gap-3 card p-4 md:grid-cols-[1fr_180px]">
      <label className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <span className="sr-only">Search</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${kind}...`}
          className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:ring-4 focus:ring-teal-50"
        />
      </label>
      <select
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        aria-label="Filter status"
        className="h-11 rounded-md border border-slate-200 bg-white px-3.5 text-sm font-medium"
      >
        <option>All</option>
        <option>Published</option>
        <option>Draft</option>
        {kind === "opportunities" && <option>Closed</option>}
      </select>
    </div>
  );
}

function ResourceRows({
  rows,
  edit,
}: {
  rows: AdminResource[];
  edit: (row: Row) => void;
}) {
  return (
    <>
      <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
        <tr>
          {["Resource", "Category", "Type", "Status", "Updated", "Action"].map(
            (heading) => (
              <th
                key={heading}
                className={`px-5 py-3.5 ${heading === "Action" ? "text-right" : ""}`}
              >
                {heading}
              </th>
            ),
          )}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((row) => (
          <tr key={row.id} className="hover:bg-slate-50">
            <td className="px-5 py-4">
              <b className="text-sm text-slate-900">{row.title}</b>
              <p className="text-xs text-slate-500">{row.id}</p>
            </td>
            <td className="px-5 py-4 text-sm text-slate-600">{row.category}</td>
            <td className="px-5 py-4 text-sm text-slate-600">{row.type}</td>
            <Badge value={row.status} />
            <td className="px-5 py-4 text-sm text-slate-500">{row.updated}</td>
            <Edit onClick={() => edit(row)} />
          </tr>
        ))}
      </tbody>
    </>
  );
}

function OpportunityRows({
  rows,
  edit,
}: {
  rows: AdminOpportunity[];
  edit: (row: Row) => void;
}) {
  return (
    <>
      <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
        <tr>
          {[
            "Opportunity",
            "Location",
            "Closes",
            "Applications",
            "Status",
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
              <b className="text-sm text-slate-900">{row.role}</b>
              <p className="text-xs text-slate-500">
                {row.organisation} · {row.id}
              </p>
            </td>
            <td className="px-5 py-4 text-sm text-slate-600">{row.location}</td>
            <td className="px-5 py-4 text-sm text-slate-500">
              {row.closingDate}
            </td>
            <td className="px-5 py-4 text-sm">{row.applications}</td>
            <Badge value={row.status} />
            <Edit onClick={() => edit(row)} />
          </tr>
        ))}
      </tbody>
    </>
  );
}

function Badge({ value }: { value: string }) {
  const classes =
    value === "Published"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : value === "Draft"
        ? "bg-slate-100 text-slate-600 ring-slate-200"
        : "bg-amber-50 text-amber-700 ring-amber-200";
  return (
    <td className="px-5 py-4">
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${classes}`}
      >
        {value}
      </span>
    </td>
  );
}
function Edit({ onClick }: { onClick: () => void }) {
  return (
    <td className="px-5 py-4 text-right">
      <button
        onClick={onClick}
        className="text-sm font-medium text-slate-600 hover:text-slate-950"
      >
        Edit
      </button>
    </td>
  );
}
function ResourceForm({ row }: { row: AdminResource }) {
  return (
    <>
      <label className="form-label sm:col-span-2">
        Description
        <textarea
          className="field"
          rows={4}
          name="description"
          maxLength={2000}
          defaultValue={row.description || ""}
        />
      </label>
      <label className="form-label">
        Resource URL
        <input
          className="field"
          type="url"
          name="url"
          defaultValue={row.url || ""}
        />
      </label>
      <label className="form-label">
        Source
        <input
          className="field"
          name="source"
          defaultValue={row.source || "Internship Tracker"}
        />
      </label>
      <label className="text-sm">
        <input type="checkbox" name="featured" defaultChecked={row.featured} />{" "}
        Featured resource
      </label>
      <label className={`${labelClass} sm:col-span-2`}>
        Title
        <input
          name="title"
          required
          defaultValue={row.title}
          className={fieldClass}
        />
      </label>
      <label className={labelClass}>
        Category
        <input
          name="category"
          required
          defaultValue={row.category}
          className={fieldClass}
        />
      </label>
      <label className={labelClass}>
        Type
        <select name="type" defaultValue={row.type} className={fieldClass}>
          <option>Guide</option>
          <option>Article</option>
          <option>Template</option>
          <option>Video</option>
        </select>
      </label>
      <label className={labelClass}>
        Status
        <select name="status" defaultValue={row.status} className={fieldClass}>
          <option>Draft</option>
          <option>Published</option>
        </select>
      </label>
    </>
  );
}
function OpportunityForm({ row }: { row: AdminOpportunity }) {
  return (
    <>
      <label className={labelClass}>
        Organisation
        <input
          name="organisation"
          required
          defaultValue={row.organisation}
          className={fieldClass}
        />
      </label>
      <label className={labelClass}>
        Role title
        <input
          name="role"
          required
          defaultValue={row.role}
          className={fieldClass}
        />
      </label>
      <label className={labelClass}>
        Location
        <input
          name="location"
          required
          defaultValue={row.location}
          className={fieldClass}
        />
      </label>
      <label className={labelClass}>
        Closing date
        <input
          type="date"
          name="closingDate"
          required
          defaultValue={row.closingDate}
          className={fieldClass}
        />
      </label>
      <label className={labelClass}>
        Status
        <select name="status" defaultValue={row.status} className={fieldClass}>
          <option>Draft</option>
          <option>Published</option>
          <option>Closed</option>
        </select>
      </label>
    </>
  );
}
