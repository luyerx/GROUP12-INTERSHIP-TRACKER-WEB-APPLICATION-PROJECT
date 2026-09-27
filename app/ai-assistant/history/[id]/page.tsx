"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import { ErrorState, LoadingState } from "@/components/ui/Feedback";
import { aiLabels, type AIFeature, type AIResult } from "@/lib/ai-contract";

type HistoryDetail = {
  id: string;
  applicationId: string;
  feature: AIFeature;
  model?: string;
  createdAt: string;
  result: AIResult;
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function AIHistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const [entry, setEntry] = useState<HistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/ai/history/${params.id}`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok || !payload.success || !payload.item) {
          throw new Error(payload.message || "Unable to load this AI history item.");
        }
        setEntry(payload.item as HistoryDetail);
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : "Unable to load this AI history item.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [params.id]);

  if (loading) return <DashboardLayout><PageHeader eyebrow="AI history" title="History detail" description="Review the saved guidance generated for this application." /><div className="mt-6"><LoadingState label="Loading AI history item…" /></div></DashboardLayout>;
  if (error) return <DashboardLayout><PageHeader eyebrow="AI history" title="History detail" description="Review the saved guidance generated for this application." /><div className="mt-6"><ErrorState message={error} /></div></DashboardLayout>;
  if (!entry) return null;

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="AI history"
        title="History detail"
        description="Review the saved guidance and recall the exact preparation advice generated for this application."
      />
      <section className="panel mb-6 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Application</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{entry.applicationId}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Generated</div>
            <div className="mt-1 text-sm text-slate-700">{formatDateTime(entry.createdAt)}</div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1">{entry.feature}</span>
          {entry.model && <span className="rounded-full bg-teal-100 px-3 py-1 text-teal-700">{entry.model}</span>}
        </div>
        <div className="mt-5 flex gap-3">
          <Link href="/ai-assistant" className="btn-secondary">Back to assistant</Link>
        </div>
      </section>

      <section className="grid min-w-0 gap-4 md:grid-cols-2">
        {Object.entries(entry.result).map(([key, values]) => (
          <article className="panel min-w-0 [overflow-wrap:anywhere]" key={key}>
            <h2 className="text-lg font-semibold">{aiLabels[key]}</h2>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-7 text-slate-600">
              {values.map((value: string, index: number) => <li key={index}>{value}</li>)}
            </ul>
          </article>
        ))}
      </section>
    </DashboardLayout>
  );
}
