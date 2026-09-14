"use client";
import Link from "next/link";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/Feedback";
import CompanyMark from "@/components/ui/CompanyMark";
import StatusBadge from "@/components/ui/StatusBadge";
import Deadline from "@/components/ui/Deadline";
import { useEffect, useState } from "react";
import type { Opportunity } from "@/lib/opportunity";
export default function OpportunityBrowser({
  mode = "student",
  compact = false,
}: {
  mode?: "student" | "employee" | "admin";
  compact?: boolean;
}) {
  const [rows, setRows] = useState<Opportunity[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [query, setQuery] = useState(""),
    [workMode, setWorkMode] = useState("All"),
    [type, setType] = useState("All"),
    [status, setStatus] = useState("All"),
    [sort, setSort] = useState("newest");
  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/opportunities", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      setRows(j.data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to load opportunities.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, []);
  const base =
    mode === "student"
      ? "/opportunities"
      : mode === "employee"
        ? "/employee/opportunities"
        : "/admin/opportunities";
  let filtered = rows.filter(
    (r) =>
      (r.role + " " + r.organisation + " " + r.location)
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (workMode === "All" || (r.workMode || "On-site") === workMode) &&
      (type === "All" || (r.employmentType || "Internship") === type) &&
      (status === "All" || r.status === status),
  );
  filtered = filtered.sort((a, b) =>
    sort === "deadline"
      ? a.closingDate.localeCompare(b.closingDate)
      : sort === "company"
        ? a.organisation.localeCompare(b.organisation)
        : b.updatedAt.localeCompare(a.updatedAt),
  );
  if (compact) filtered = filtered.slice(0, 3);
  const clearFilters = () => {
    setQuery("");
    setWorkMode("All");
    setType("All");
    setStatus("All");
    setSort("newest");
  };
  return (
    <div>
      {!compact && (
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">
              {mode === "student"
                ? "Career discovery"
                : mode === "employee"
                  ? "Recruitment"
                  : "Content management"}
            </p>
            <h1 className="page-title">
              {mode === "employee" ? "My Opportunities" : "Opportunities"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              {mode === "student"
                ? "Find your next step. Track a published role in My Applications, then follow the employer’s instructions to apply."
                : "Create clear listings, publish when ready, and close opportunities when recruitment ends."}
            </p>
          </div>
          {mode !== "student" && (
            <Link className="btn" href={base + "/new"}>
              Create Opportunity
            </Link>
          )}
        </header>
      )}
      {!compact && (
        <section
          aria-label="Search and filter opportunities"
          className="panel mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
        >
          <label className="form-label">
            Search
            <input
              className="field"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Role, company or location"
            />
          </label>
          <label className="form-label">
            Work arrangement
            <select
              className="field"
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value)}
            >
              {["All", "On-site", "Hybrid", "Remote"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="form-label">
            Role type
            <select
              className="field"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {["All", "Internship", "Graduate", "Part-time"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="form-label">
            Sort by
            <select
              className="field"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Recently updated</option>
              <option value="deadline">Closing soon</option>
              <option value="company">Company A–Z</option>
            </select>
          </label>
          {mode !== "student" ? (
            <label className="form-label">
              Publication status
              <select
                className="field"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {["All", "Draft", "Published", "Closed"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          ) : (
            <div className="flex items-end">
              <button
                className="btn-secondary"
                onClick={() => {
                  setQuery("");
                  setWorkMode("All");
                  setType("All");
                  setSort("newest");
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      )}
      {loading ? (
        <LoadingState label="Loading opportunities…" />
      ) : error ? (
        <ErrorState
          title="Unable to load opportunities"
          message={error}
          retry={() => void load()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={
            rows.length
              ? "No matching opportunities"
              : mode === "student"
                ? "Your next opportunity is on its way"
                : "Publish your first opportunity"
          }
          description={
            rows.length
              ? "Try a broader search or reset your filters to see all listings."
              : mode === "student"
                ? "No open roles are available yet. You can still track roles you find on company websites, LinkedIn or Seek."
                : "Start with a draft, add the role details, then publish when you are ready."
          }
          action={
            rows.length ? (
              <button className="btn-secondary" onClick={clearFilters}>
                Clear filters
              </button>
            ) : (
              <Link
                className="btn"
                href={mode === "student" ? "/applications/new" : base + "/new"}
              >
                {mode === "student"
                  ? "Add External Application"
                  : "Create Opportunity"}
              </Link>
            )
          }
        />
      ) : (
        <>
          <p role="status" className="mb-3 text-sm text-slate-500">
            {filtered.length} {compact ? "recent" : "matching"} opportunities
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((row) => (
              <article key={row.id} className="panel job-card flex flex-col">
                <div className="mb-5 flex items-center justify-between gap-2">
                  <CompanyMark name={row.organisation} />
                  <StatusBadge value={row.status} />
                </div>
                <p className="text-sm text-slate-500">{row.organisation}</p>
                <h2 className="mt-1 text-lg font-semibold">
                  <Link
                    href={base + "/" + row.id}
                    className="hover:text-teal-700"
                  >
                    {row.role}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {row.location} · {row.workMode || "On-site"}
                </p>
                <div className="my-4 flex flex-wrap gap-2">
                  <span className="badge">
                    {row.employmentType || "Internship"}
                  </span>
                  <span className="badge">{row.workMode || "On-site"}</span>
                  {row.applicationId && <StatusBadge value="Tracked" />}
                </div>
                <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                  {row.description ||
                    "View this listing for details and closing dates."}
                </p>
                {mode === "admin" && (
                  <p className="mt-3 text-xs text-slate-500">
                    Publisher: {row.publisher}
                  </p>
                )}
                <div className="mt-auto pt-5">
                  <div className="mb-4 border-t border-slate-100 pt-4">
                    <Deadline value={row.closingDate} />
                  </div>
                  <Link
                    className="btn-secondary w-full"
                    href={base + "/" + row.id}
                  >
                    {mode === "student"
                      ? "View role & application steps →"
                      : "Manage opportunity →"}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
