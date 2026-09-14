"use client";
import Link from "next/link";
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
        <p role="status" className="panel mt-6">
          Loading opportunity…
        </p>
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
                <p className="eyebrow">{row.organisation}</p>
                <h1 className="page-title">{row.role}</h1>
                <p className="mt-4">
                  {row.location} · {row.workMode || "On-site"} ·{" "}
                  {row.employmentType || "Internship"}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="badge" data-status={row.status}>
                    {row.status}
                  </span>
                  <span className="text-sm">Closes {row.closingDate}</span>
                </div>
              </header>
              <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <section className="panel">
                  <h2 className="text-xl font-semibold">
                    About this opportunity
                  </h2>
                  <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-600">
                    {row.description ||
                      "The publisher has not added a description. Check the original listing or contact the organisation for requirements before applying."}
                  </p>
                </section>
                <aside className="panel h-fit">
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
                        {busy ? "Saving…" : "Track / Add to My Applications"}
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
                        Employer application page ↗
                      </a>
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
