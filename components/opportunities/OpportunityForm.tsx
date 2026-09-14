"use client";
import Link from "next/link";
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
        if (active) setError(e.message);
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
    <>
      <Link href={base} className="text-sm font-semibold text-teal-700">
        ← Back to opportunities
      </Link>
      <header className="my-6">
        <p className="eyebrow">Recruitment publishing</p>
        <h1 className="page-title">{id ? "Edit" : "Create"} Opportunity</h1>
        <p className="mt-3 text-slate-600">
          Give students the context they need. Save a draft or publish a
          complete listing.
        </p>
      </header>
      {loading ? (
        <p role="status">Loading listing…</p>
      ) : (
        <form className="panel max-w-4xl" onSubmit={save}>
          <fieldset disabled={busy} className="grid gap-5 sm:grid-cols-2">
            {[
              ["organisation", "Company / organisation", "text", 120],
              ["role", "Role title", "text", 160],
              ["location", "Location", "text", 120],
              ["closingDate", "Closing date (New Zealand)", "date", 10],
            ].map(([name, label, type, max]) => (
              <label className="form-label" key={String(name)}>
                {label}
                <input
                  className="field"
                  required
                  type={String(type)}
                  maxLength={Number(max)}
                  value={data[name as keyof OpportunityInput]}
                  onChange={(e) =>
                    update(name as keyof OpportunityInput, e.target.value)
                  }
                />
              </label>
            ))}
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
                [
                  "status",
                  "Publication status",
                  ["Draft", "Published", "Closed"],
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
            <label className="form-label sm:col-span-2">
              Description, requirements and how to apply
              <textarea
                className="field"
                rows={10}
                maxLength={20000}
                minLength={data.status === "Published" ? 30 : 0}
                required={data.status === "Published"}
                value={data.description}
                onChange={(e) => update("description", e.target.value)}
              />
              <span className="text-xs font-normal text-slate-500">
                Include responsibilities, eligibility and application
                instructions. Published roles need at least 30 characters.
              </span>
            </label>
          </fieldset>
          {error && (
            <p role="alert" className="mt-4 text-rose-700">
              {error}
            </p>
          )}
          <div className="mt-6 flex gap-3">
            <button className="btn" disabled={busy}>
              {busy
                ? "Saving…"
                : "Save " + data.status.toLowerCase() + " opportunity"}
            </button>
            <Link className="btn-secondary" href={base}>
              Cancel
            </Link>
          </div>
        </form>
      )}
    </>
  );
}
