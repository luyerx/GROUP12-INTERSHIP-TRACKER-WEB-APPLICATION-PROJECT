"use client";
import { formatAppDate } from "@/lib/date";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { LoadingState, ErrorState } from "@/components/ui/Feedback";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { OpportunityInput } from "@/lib/opportunity";
const empty: OpportunityInput = {
  organisation: "",
  role: "",
  location: "",
  closingDate: "",
  status: "Draft",
  description: "",
  employmentType: "Internship",
  workMode: "On-site",
  applicationUrl: "",
};
export default function OpportunityForm({
  id,
  mode,
}: {
  id?: string;
  mode: "employee" | "admin";
}) {
  const [loadFailed, setLoadFailed] = useState(false);
  const [data, setData] = useState(empty),
    [loading, setLoading] = useState(!!id),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const router = useRouter();
  const base =
    mode === "employee" ? "/employee/opportunities" : "/admin/opportunities";
  useEffect(() => {
    if (!id) return;
    let active = true;
    fetch("/api/opportunities/" + id)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.message);
        if (active) setData({ ...empty, ...j.data });
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setLoadFailed(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/opportunities" + (id ? "/" + id : ""), {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      router.push(base + "/" + j.data.id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
      setBusy(false);
    }
  }
  const update = (name: keyof OpportunityInput, value: string) =>
    setData((d) => ({ ...d, [name]: value }));
  return (
    <div className="max-w-5xl">
      <Link
        href={base}
        className="mb-6 inline-flex text-sm font-semibold text-teal-700"
      >
        ← Back to opportunities
      </Link>
      <PageHeader
        eyebrow="Recruitment publishing"
        title={(id ? "Edit" : "Create") + " Opportunity"}
        description="Help students understand the role and how to apply. Required fields are marked *."
      />
      {loading ? (
        <LoadingState label="Loading listing…" />
      ) : loadFailed ? (
        <ErrorState
          title="Unable to load listing"
          message={error}
          retry={() => window.location.reload()}
        />
      ) : (
        <form onSubmit={save}>
          <fieldset disabled={busy} className="space-y-5">
            <section className="form-section">
              <div className="form-section-header">
                <h2>01 · Basic information</h2>
                <p>
                  Introduce the organisation and the role you are hiring for.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {(
                  [
                    ["organisation", "Company / organisation", 120],
                    ["role", "Role title", 160],
                  ] as const
                ).map(([name, label, max]) => (
                  <label className="form-label" key={name}>
                    {label} *
                    <input
                      className="field"
                      required
                      maxLength={max}
                      value={data[name]}
                      onChange={(e) => update(name, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            </section>
            <section className="form-section">
              <div className="form-section-header">
                <h2>02 · Work details</h2>
                <p>Set expectations about where and how students will work.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="form-label sm:col-span-2">
                  Location *
                  <input
                    className="field"
                    required
                    maxLength={120}
                    value={data.location}
                    onChange={(e) => update("location", e.target.value)}
                    placeholder="City or region"
                  />
                </label>
                {(
                  [
                    [
                      "employmentType",
                      "Role type",
                      ["Internship", "Graduate", "Part-time"],
                    ],
                    [
                      "workMode",
                      "Work arrangement",
                      ["On-site", "Hybrid", "Remote"],
                    ],
                  ] as const
                ).map(([name, label, options]) => (
                  <label className="form-label" key={name}>
                    {label}
                    <select
                      className="field"
                      value={data[name]}
                      onChange={(e) => update(name, e.target.value)}
                    >
                      {options.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </section>
            <section className="form-section">
              <div className="form-section-header">
                <h2>03 · Application details</h2>
                <p>
                  Tracking a role does not submit an application. Provide the
                  employer application route.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="form-label">
                  Closing date (New Zealand) *
                  {data.closingDate && <span className="block text-xs text-slate-500">{formatAppDate(data.closingDate)}</span>}
                  <input
                    className="field"
                    required
                    type="date"
                    lang="en-NZ"
                    value={data.closingDate}
                    onChange={(e) => update("closingDate", e.target.value)}
                  />
                </label>
                <label className="form-label">
                  Application URL (optional)
                  <input
                    className="field"
                    type="url"
                    maxLength={2000}
                    placeholder="https://company.com/careers"
                    value={data.applicationUrl}
                    onChange={(e) => update("applicationUrl", e.target.value)}
                  />
                </label>
              </div>
            </section>
            <section className="form-section">
              <div className="form-section-header">
                <h2>04 · Description</h2>
                <p>
                  Use short paragraphs for responsibilities, eligibility and
                  application instructions.
                </p>
              </div>
              <label className="form-label">
                About this opportunity{data.status === "Published" ? " *" : ""}
                <textarea
                  className="field"
                  rows={10}
                  maxLength={20000}
                  minLength={data.status === "Published" ? 30 : 0}
                  required={data.status === "Published"}
                  aria-describedby="description-hint"
                  value={data.description}
                  onChange={(e) => update("description", e.target.value)}
                />
                <span
                  id="description-hint"
                  className="text-xs font-normal text-slate-500"
                >
                  Published roles need at least 30 characters.{" "}
                  {data.description.length.toLocaleString()} / 20,000
                  characters.
                </span>
              </label>
            </section>
            <section className="form-section">
              <div className="form-section-header">
                <h2>05 · Publishing</h2>
                <p>Choose when students can discover this opportunity.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="form-label">
                  Publication status
                  <select
                    className="field"
                    aria-describedby="publication-hint"
                    value={data.status}
                    onChange={(e) => update("status", e.target.value)}
                  >
                    {["Draft", "Published", "Closed"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </label>
                <div className="rounded-xl bg-slate-50 p-4">
                  <StatusBadge value={data.status} />
                  <p
                    id="publication-hint"
                    className="mt-2 text-sm leading-6 text-slate-600"
                  >
                    {data.status === "Draft"
                      ? "Keep this listing private while you prepare it."
                      : data.status === "Published"
                        ? "Students can discover published listings while the closing date is current."
                        : "This listing will no longer appear in student discovery."}
                  </p>
                </div>
              </div>
            </section>
          </fieldset>
          {error && (
            <div className="mt-5">
              <ErrorState
                title="Listing could not be saved or loaded"
                message={error}
              />
            </div>
          )}
          <section className="next-actions mt-5" aria-label="Listing review">
            <div><p className="eyebrow">Before you save</p><h2 className="mt-2 font-semibold">Publishing review</h2><p className="mt-1 text-sm text-slate-600">A guide based on your current fields; review the content before publishing.</p></div>
            <ul className="grid gap-3 sm:grid-cols-2">{[
              ["Organisation and role", Boolean(data.organisation.trim() && data.role.trim())],
              ["Location and closing date", Boolean(data.location.trim() && data.closingDate)],
              ["Description (30+ characters)", data.description.trim().length >= 30],
              ["Employer link (optional)", /^https?:\/\//i.test(data.applicationUrl || "")],
            ].map(([label, complete]) => <li key={String(label)} className="text-sm"><span className={complete ? "text-teal-800" : "text-slate-600"}>{complete ? "✓ Added" : "○ Review"}</span> · {label}</li>)}</ul>
          </section>
          <div className="card mt-5 flex flex-wrap items-center justify-between gap-4 p-5">
            <p className="text-xs text-slate-500">
              Review your details before saving.
            </p>
            <div className="page-actions">
              <Link className="btn-secondary" href={base}>
                Cancel
              </Link>
              <button className="btn" disabled={busy}>
                {busy
                  ? "Saving…"
                  : "Save " + data.status.toLowerCase() + " opportunity"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
