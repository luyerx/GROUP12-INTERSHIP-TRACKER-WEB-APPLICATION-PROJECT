"use client";
import Link from "next/link";
import CompanyMark from "@/components/ui/CompanyMark";
import Deadline from "@/components/ui/Deadline";
import StatusBadge from "@/components/ui/StatusBadge";
import { LoadingState } from "@/components/ui/Feedback";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Opportunity } from "@/lib/opportunity";
export default function OpportunityDetail({
  id,
  mode,
}: {
  id: string;
  mode: "student" | "employee" | "admin";
}) {
  const [row, setRow] = useState<Opportunity | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  const base =
    mode === "student"
      ? "/opportunities"
      : mode === "employee"
        ? "/employee/opportunities"
        : "/admin/opportunities";
  useEffect(() => {
    let active = true;
    fetch("/api/opportunities/" + id, { cache: "no-store" })
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.message);
        if (active) setRow(j.data);
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
  async function track() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/opportunities/" + id + "/track", {
        method: "POST",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      router.push("/applications/" + j.data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to track.");
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="text-sm font-semibold text-teal-700" href={base}>
        ← Back to opportunities
      </Link>
      {loading ? (
        <div className="mt-6">
          <LoadingState label="Loading opportunity…" />
        </div>
      ) : (
        <>
          {error && (
            <p role="alert" className="panel mt-6 text-rose-700">
              {error}{" "}
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary"
              >
                Retry
              </button>
            </p>
          )}
          {row && (
            <>
              <header className="hero my-6">
                <div className="mb-5 flex items-center gap-4">
                  <CompanyMark name={row.organisation} large />
                  <div>
                    <p className="eyebrow">Opportunity at</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {row.organisation}
                    </p>
                  </div>
                </div>
                <h1 className="page-title">{row.role}</h1>
                <p className="mt-4">
                  {row.location} · {row.workMode || "On-site"} ·{" "}
                  {row.employmentType || "Internship"}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <StatusBadge value={row.status} />
                  <Deadline value={row.closingDate} />
                </div>
              </header>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <section className="panel">
                  <h2 className="text-xl font-semibold">
                    About this opportunity
                  </h2>
                  <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-600">
                    {row.description ||
                      "The publisher has not added a description. Check the original listing or contact the organisation for requirements before applying."}
                  </p>
                </section>
                <aside className="panel h-fit lg:sticky lg:top-6">
                  <h2 className="font-semibold">
                    {mode === "student"
                      ? "Make your next move"
                      : "Manage publication"}
                  </h2>
                  <p className="my-4 text-sm leading-6 text-slate-600">
                    {mode === "student"
                      ? "Track saves this role in your personal pipeline. It does not submit an application to the employer."
                      : "Draft listings are private. Published listings with an open closing date appear in student discovery. Close a listing to end discovery."}
                  </p>
                  {mode === "student" ? (
                    row.applicationId ? (
                      <Link
                        className="btn w-full"
                        href={"/applications/" + row.applicationId}
                      >
                        Open My Application
                      </Link>
                    ) : (
                      <button
                        disabled={busy || row.status !== "Published"}
                        className="btn w-full"
                        onClick={() => void track()}
                      >
                        {busy ? "Saving…" : "Add to My Tracker"}
                      </button>
                    )
                  ) : (
                    <Link
                      className="btn w-full"
                      href={base + "/" + id + "/edit"}
                    >
                      Edit Opportunity
                    </Link>
                  )}
                  {row.applicationUrl &&
                    /^https?:\/\//i.test(row.applicationUrl) && (
                      <a
                        className="btn-secondary mt-3 w-full"
                        href={row.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Apply on Employer Site ↗
                      </a>
                    )}
                  {mode === "student" && (
                    <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
                      {row.applicationUrl
                        ? "The employer site opens in a new tab. Submit your application there, then update your progress in your tracker."
                        : "No employer link has been provided. Follow the instructions in the description or contact the organisation to apply."}
                    </p>
                  )}
                </aside>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
