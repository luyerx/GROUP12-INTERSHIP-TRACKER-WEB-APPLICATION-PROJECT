"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/Feedback";
import { aiLabels, aiSchemas, type AIFeature, type AIResult } from "@/lib/ai-contract";

type Choice = { id: string; roleTitle: string; organisation: string };
export default function AIAssistantPage() {
  const [applications, setApplications] = useState<Choice[]>([]);
  const [applicationId, setApplicationId] = useState("");
  const [feature, setFeature] = useState<AIFeature>("interview-prep");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [reload, setReload] = useState(0);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setLoadError("");
      try {
        const response = await fetch("/api/applications", { cache: "no-store", signal: controller.signal });
        const payload = await response.json();
        if (!response.ok || !payload.success || !Array.isArray(payload.data)) throw new Error("Unable to load your applications.");
        setApplications(payload.data);
        const requested = new URLSearchParams(window.location.search).get("applicationId");
        setApplicationId(payload.data.some((app: Choice) => app.id === requested) ? requested! : "");
        if (requested && !payload.data.some((app: Choice) => app.id === requested)) setError("The linked application is not available. Please choose one of your applications.");
      } catch { if (!controller.signal.aborted) setLoadError("Unable to load your applications. Please try again."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => { controller.abort(); pending.current?.abort(); };
  }, [reload]);

  async function generate() {
    if (!applicationId || pending.current) return;
    const controller = new AbortController(); pending.current = controller;
    setBusy(true); setError(""); setResult(null);
    const timer = setTimeout(() => controller.abort(), 55000);
    try {
      const response = await fetch(`/api/ai/${feature}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ applicationId }), signal: controller.signal });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to generate guidance. Please try again.");
      const parsed = aiSchemas[feature].safeParse(payload.data);
      if (!parsed.success) throw new Error("AI returned an unexpected response. Please try again.");
      setResult(parsed.data);
    } catch (failure) {
      setError(controller.signal.aborted ? "The request timed out. Please try again." : failure instanceof Error ? failure.message : "Unable to generate guidance.");
    } finally { clearTimeout(timer); pending.current = null; setBusy(false); }
  }

  return <DashboardLayout>
    <PageHeader eyebrow="Career preparation" title="AI Career Assistant" description="Turn a saved application and your profile into a practical preparation plan." />
    {loading ? <LoadingState label="Loading your applications…" /> : loadError ? <ErrorState message={loadError} retry={() => setReload(value => value + 1)} /> : applications.length === 0 ? <EmptyState title="Start with an application" description="Save an application before generating personalised guidance." action={<Link className="btn" href="/applications/new">Add an application</Link>} /> : <>
      <section className="panel min-w-0">
        <label className="form-label" htmlFor="ai-application">Application</label>
        <select id="ai-application" className="field min-w-0 max-w-full" value={applicationId} disabled={busy} onChange={event => { setApplicationId(event.target.value); setResult(null); setError(""); }}>
          <option value="">Choose an application</option>
          {applications.map(app => <option key={app.id} value={app.id}>{app.roleTitle} — {app.organisation}</option>)}
        </select>
        <fieldset className="mt-5" disabled={busy}>
          <legend className="form-label">What would you like to prepare?</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {([ ["interview-prep", "Interview Preparation", "Practice questions, skills to highlight and questions for the employer."], ["application-insights", "Application Insights", "Strengths, areas to prepare and a practical application checklist."] ] as const).map(([value, title, copy]) => <label key={value} className={`card flex min-w-0 cursor-pointer items-start gap-3 p-4 ${feature === value ? "border-teal-600 bg-teal-50" : ""}`}>
              <input className="mt-1 accent-teal-700" type="radio" name="ai-feature" value={value} checked={feature === value} onChange={() => { setFeature(value); setResult(null); setError(""); }} />
              <span><span className="font-semibold">{title}</span><span className="mt-1 block text-sm text-slate-600">{copy}</span></span>
            </label>)}
          </div>
        </fieldset>
        <p className="mt-4 text-sm leading-6 text-slate-600">Generating sends relevant profile skills and education, plus the selected job details, to Google Gemini. Guidance may be inaccurate; verify it against the job listing. Results are not saved.</p>
        <div className="page-actions mt-4"><button className="btn" disabled={!applicationId || busy} onClick={() => void generate()}>{busy ? "Generating…" : "Generate"}</button><Link className="btn-secondary" href="/profile">Review profile</Link></div>
      </section>
      <div className="mt-6" aria-live="polite" aria-busy={busy}>
        {busy && <LoadingState label="Preparing your personalised guidance…" />}
        {error && <ErrorState title="Guidance unavailable" message={error} />}
        {result && <section aria-label="AI guidance" className="grid min-w-0 gap-4 md:grid-cols-2">
          {Object.entries(result).map(([key, values]) => <article className="panel min-w-0 [overflow-wrap:anywhere]" key={key}><h2 className="text-lg font-semibold">{aiLabels[key]}</h2><ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-7 text-slate-600">{values.map((value: string, index: number) => <li key={index}>{value}</li>)}</ul></article>)}
        </section>}
      </div>
    </>}
  </DashboardLayout>;
}
