"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import { ErrorState, LoadingState } from "@/components/ui/Feedback";
import AIResults from "@/components/ai/AIResults";
import { aiFeatureTitles, type AIFeature, type AIResult } from "@/lib/ai-contract";

type HistoryDetail = {
  id: string;
  applicationId?: string;
  feature: AIFeature;
  model?: string;
  createdAt: string;
  result: AIResult;
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString("en-NZ", { timeZone: "Pacific/Auckland", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function AIHistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const [entry, setEntry] = useState<HistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

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
  }, [params.id, reload]);

  if (loading) return <DashboardLayout><PageHeader eyebrow="AI history" title="History detail" description="Review your saved career guidance." /><div className="mt-6"><LoadingState label="Loading AI history item…" /></div></DashboardLayout>;
  if (error) return <DashboardLayout><PageHeader eyebrow="AI history" title="History detail" description="Review your saved career guidance." /><div className="mt-6"><ErrorState message={error} retry={() => setReload(value => value + 1)} /></div></DashboardLayout>;
  if (!entry) return null;

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="AI history"
        title="History detail"
        description="Review your previously generated career guidance. Availability and role details may have changed."
      />
      <section className="panel mb-6 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Application</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{entry.applicationId ? <Link className="text-teal-700 underline" href={`/applications/${entry.applicationId}`}>View saved application</Link> : "Opportunity discovery"}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Generated</div>
            <div className="mt-1 text-sm text-slate-700">{formatDateTime(entry.createdAt)}</div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1">{aiFeatureTitles[entry.feature]}</span>
          {entry.model && <span className="rounded-full bg-teal-100 px-3 py-1 text-teal-700">{entry.model}</span>}
        </div>
        <div className="mt-5 flex gap-3">
          <Link href="/ai-assistant" className="btn-secondary">Back to assistant</Link>
        </div>
      </section>

      {entry.feature === "document-assistant" && <p className="mb-4 text-sm text-slate-600">AI suggestions should be reviewed and edited by the user before use. Only guidance and short excerpts are saved.</p>}
      <AIResults feature={entry.feature} result={entry.result} historical />
    </DashboardLayout>
  );
}
