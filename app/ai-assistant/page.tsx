"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState, SuccessFeedback } from "@/components/ui/Feedback";
import { aiLabels, aiSchemas, type AIFeature, type AIResult } from "@/lib/ai-contract";

type Choice = { id: string; roleTitle: string; organisation: string };

type AIHistoryEntry = {
  id: string;
  applicationId: string;
  feature: AIFeature;
  model?: string;
  createdAt: string;
  result: AIResult;
};

type AIErrorView = {
  title: string;
  message: string;
};

type UsageSummary = {
  monthKey: string;
  used: number;
  softLimit: number;
  hardLimit: number;
  remaining: number;
  warning: boolean;
  reachedSoftLimit: boolean;
  reachedHardLimit: boolean;
};

const AI_HISTORY_KEY = "ai-assistant-history-v1";
const MAX_HISTORY_ITEMS = 8;

function parseAIError(payload: unknown, fallback: string): AIErrorView {
  if (!payload || typeof payload !== "object") return { title: "Guidance unavailable", message: fallback };

  const maybe = payload as {
    code?: string;
    message?: string;
    details?: string;
  };

  const code = maybe.code ?? "AI_INTERNAL_ERROR";
  const message = maybe.message || maybe.details || fallback;

  switch (code) {
    case "AI_PROVIDER_ACCESS_DENIED":
      return {
        title: "AI access unavailable",
        message: "The Gemini API key is missing or invalid. Please contact the project administrator and verify the server-side configuration.",
      };
    case "AI_PROVIDER_QUOTA":
      return {
        title: "Quota reached",
        message: "The Gemini API quota has been used up for this period. Please try again later or contact the project administrator.",
      };
    case "AI_TIMEOUT":
      return {
        title: "Provider timeout",
        message: "Gemini did not respond in time. Please try again in a moment.",
      };
    case "AI_INVALID_RESPONSE":
      return {
        title: "Unexpected AI response",
        message: "Gemini returned a malformed response. Please try again. If the problem keeps happening, contact the administrator.",
      };
    case "AI_MONTHLY_LIMIT":
      return {
        title: "Monthly AI limit reached",
        message: "You have reached the monthly AI usage limit for this account. Please try again next month.",
      };
    case "AI_AUTH_REQUIRED":
      return {
        title: "Please sign in again",
        message: "Your session expired before AI guidance could be generated. Please sign in again and try once more.",
      };
    case "AI_ACCESS_DENIED":
      return {
        title: "Access denied",
        message: "You do not have permission to use the AI assistant for this account.",
      };
    default:
      return { title: "Guidance unavailable", message };
  }
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function featureTitle(feature: AIFeature) {
  return feature === "interview-prep" ? "Interview prep" : "Application insights";
}

async function loadHistoryFromServer() {
  try {
    const response = await fetch("/api/ai/history", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || !payload.success || !Array.isArray(payload.history)) return [];
    return payload.history as AIHistoryEntry[];
  } catch {
    return [];
  }
}

export default function AIAssistantPage() {
  const [applications, setApplications] = useState<Choice[]>([]);
  const [applicationId, setApplicationId] = useState("");
  const [feature, setFeature] = useState<AIFeature>("interview-prep");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState<AIErrorView | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [history, setHistory] = useState<AIHistoryEntry[]>([]);
  const [dateFilter, setDateFilter] = useState<"all" | "7d" | "30d" | "this-month">("all");
  const [reload, setReload] = useState(0);
  const pending = useRef<AbortController | null>(null);

  async function refreshUsage() {
    try {
      const response = await fetch("/api/ai/usage", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success || !payload.usage) return;
      setUsage(payload.usage as UsageSummary);
    } catch {
      // Ignore usage refresh errors; the page can still function.
    }
  }

  useEffect(() => {
    const loadHistory = async () => {
      const serverEntries = await loadHistoryFromServer();
      if (serverEntries.length > 0) {
        setHistory(serverEntries.slice(0, MAX_HISTORY_ITEMS));
        try {
          window.localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(serverEntries.slice(0, MAX_HISTORY_ITEMS)));
        } catch {
          // ignore storage errors
        }
      } else {
        try {
          const raw = window.localStorage.getItem(AI_HISTORY_KEY);
          if (!raw) return;
          const parsed = JSON.parse(raw) as AIHistoryEntry[];
          if (Array.isArray(parsed)) setHistory(parsed.slice(0, MAX_HISTORY_ITEMS));
        } catch {
          // Ignore corrupted local storage history and start with a fresh list.
        }
      }
    };

    void loadHistory();
  }, []);

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
        if (requested && !payload.data.some((app: Choice) => app.id === requested)) setError({ title: "Linked application unavailable", message: "The linked application is not available. Please choose one of your applications." });
      } catch { if (!controller.signal.aborted) setLoadError("Unable to load your applications. Please try again."); }
      finally { if (!controller.signal.aborted) { setLoading(false); void refreshUsage(); } }
    }
    void load();
    return () => { controller.abort(); pending.current?.abort(); };
  }, [reload]);

  function persistHistory(next: AIHistoryEntry[]) {
    setHistory(next);
    try {
      window.localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }

  function saveHistoryEntry(entry: AIHistoryEntry) {
    setHistory(previous => {
      const next = [entry, ...previous.filter(item => !(item.applicationId === entry.applicationId && item.feature === entry.feature))].slice(0, MAX_HISTORY_ITEMS);
      try {
        window.localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }

  async function clearHistory() {
    setHistory([]);
    try {
      window.localStorage.removeItem(AI_HISTORY_KEY);
    } catch {
      // ignore storage errors
    }
    try {
      await fetch("/api/ai/history", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clearAll: true }) });
    } catch {
      // ignore delete errors and keep UI state consistent
    }
  }

  async function removeHistoryEntry(itemId: string) {
    const next = history.filter(item => item.id !== itemId);
    persistHistory(next);
    try {
      await fetch("/api/ai/history", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: itemId }) });
    } catch {
      // ignore delete errors and keep UI state consistent
    }
  }

  async function generate() {
    if (!applicationId || pending.current) return;
    const controller = new AbortController(); pending.current = controller;
    setBusy(true); setError(null); setResult(null);
    const timer = setTimeout(() => controller.abort(), 55000);
    try {
      const response = await fetch(`/api/ai/${feature}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ applicationId }), signal: controller.signal });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        const parsed = parseAIError(payload, "Unable to generate guidance. Please try again.");
        throw new Error(parsed.message);
      }
      if (payload.usage && typeof payload.usage === "object") {
        setUsage(payload.usage as UsageSummary);
      } else {
        await refreshUsage();
      }
      const parsed = aiSchemas[feature].safeParse(payload.data);
      if (!parsed.success) {
        throw new Error("AI returned an unexpected response. Please try again.");
      }
      const entry: AIHistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        applicationId,
        feature,
        model: "gemini-3.5-flash",
        createdAt: new Date().toISOString(),
        result: parsed.data,
      };
      saveHistoryEntry(entry);
      try {
        await fetch("/api/ai/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationId,
            feature,
            model: entry.model,
            result: parsed.data,
          }),
        });
      } catch {
        // keep UI working even if persistence fails
      }
      setResult(parsed.data);
    } catch (failure) {
      if (controller.signal.aborted) {
        setError({ title: "Provider timeout", message: "Gemini did not respond in time. Please try again in a moment." });
        return;
      }

      const message = failure instanceof Error ? failure.message : "Unable to generate guidance.";
      const parsed = parseAIError({ message }, message);
      setError(parsed);
    } finally { clearTimeout(timer); pending.current = null; setBusy(false); }
  }

  const filteredHistory = history.filter((item) => {
    if (dateFilter === "all") return true;
    const date = new Date(item.createdAt);
    const now = new Date();
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    if (dateFilter === "7d") return diffDays <= 7;
    if (dateFilter === "30d") return diffDays <= 30;
    if (dateFilter === "this-month") {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    return true;
  });

  return <DashboardLayout>
    <PageHeader eyebrow="Career preparation" title="AI Career Assistant" description="Turn a saved application and your profile into a practical preparation plan." />
    {loading ? <LoadingState label="Loading your applications…" /> : loadError ? <ErrorState message={loadError} retry={() => setReload(value => value + 1)} /> : applications.length === 0 ? <EmptyState title="Start with an application" description="Save an application before generating personalised guidance." action={<Link className="btn" href="/applications/new">Add an application</Link>} /> : <>
      <section className="panel min-w-0">
        <label className="form-label" htmlFor="ai-application">Application</label>
        <select id="ai-application" className="field min-w-0 max-w-full" value={applicationId} disabled={busy} onChange={event => { setApplicationId(event.target.value); setResult(null); setError(null); }}>
          <option value="">Choose an application</option>
          {applications.map(app => <option key={app.id} value={app.id}>{app.roleTitle} — {app.organisation}</option>)}
        </select>
        <fieldset className="mt-5" disabled={busy}>
          <legend className="form-label">What would you like to prepare?</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {([ ["interview-prep", "Interview Preparation", "Practice questions, skills to highlight and questions for the employer."], ["application-insights", "Application Insights", "Strengths, areas to prepare and a practical application checklist."] ] as const).map(([value, title, copy]) => <label key={value} className={`card flex min-w-0 cursor-pointer items-start gap-3 p-4 ${feature === value ? "border-teal-600 bg-teal-50" : ""}`}>
              <input className="mt-1 accent-teal-700" type="radio" name="ai-feature" value={value} checked={feature === value} onChange={() => { setFeature(value); setResult(null); setError(null); }} />
              <span><span className="font-semibold">{title}</span><span className="mt-1 block text-sm text-slate-600">{copy}</span></span>
            </label>)}
          </div>
        </fieldset>
        <p className="mt-4 text-sm leading-6 text-slate-600">Generating sends relevant profile skills and education, plus saved application details, to Google Gemini. For tracked opportunities, AI uses the tracking snapshot, not the latest listing. Guidance may be inaccurate; verify it against the job listing. Results are not saved.</p>
        <div className="page-actions mt-4"><button className="btn" disabled={!applicationId || busy} onClick={() => void generate()}>{busy ? "Generating…" : "Generate"}</button><Link className="btn-secondary" href="/profile">Review profile</Link></div>
      </section>

      <div className="mt-6" aria-live="polite" aria-busy={busy}>
        {usage && (
          <section className="panel mb-6 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">Monthly AI usage</div>
                <div className="text-sm text-slate-600">{usage.used} / {usage.hardLimit} requests used</div>
              </div>
              <div className="text-right text-sm font-medium text-slate-700">
                {usage.remaining} remaining
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.min(100, (usage.used / usage.hardLimit) * 100)}%` }} />
            </div>
            {usage.warning && !usage.reachedHardLimit && (
              <div className="mt-3 text-sm text-amber-700">You are approaching the monthly AI limit. Consider saving the most important guidance requests for this month.</div>
            )}
            {usage.reachedHardLimit && (
              <div className="mt-3 text-sm text-rose-700">You have reached the monthly AI limit. Please try again next month.</div>
            )}
          </section>
        )}
        {usage && usage.warning && !usage.reachedHardLimit && (
          <SuccessFeedback>
            AI usage warning: you have used {usage.used}/{usage.softLimit} requests this month. You have {usage.remaining} requests left before the monthly limit.
          </SuccessFeedback>
        )}

        {history.length > 0 && (
          <section className="panel mb-6 min-w-0">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Recent history</h2>
              <button type="button" className="btn-secondary btn-small" onClick={() => void clearHistory()}>Clear all</button>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {(["all", "7d", "30d", "this-month"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={dateFilter === value ? "rounded-lg px-3 py-2 text-sm font-medium bg-teal-700 text-white hover:bg-teal-800" : "rounded-lg px-3 py-2 text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"}
                  onClick={() => setDateFilter(value)}
                >
                  {value === "all" ? "All time" : value === "7d" ? "Last 7 days" : value === "30d" ? "Last 30 days" : "This month"}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {filteredHistory.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">No AI history matches this date range.</div>
              ) : (
                filteredHistory.map(item => {
                  const app = applications.find(app => app.id === item.applicationId);
                  const appLabel = app ? `${app.roleTitle} — ${app.organisation}` : "Saved application";
                  return (
                    <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <Link href={`/ai-assistant/history/${item.id}`} className="flex-1 text-left">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-medium text-slate-900">{featureTitle(item.feature)}</div>
                              <div className="text-sm text-slate-600">{appLabel}</div>
                            </div>
                            <span className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</span>
                          </div>
                        </Link>
                        <button type="button" className="btn-secondary btn-small" onClick={() => void removeHistoryEntry(item.id)}>Delete</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {busy && <LoadingState label="Preparing your personalised guidance…" />}
        {error && <ErrorState title={error.title} message={error.message} />}
        {result && <section aria-label="AI guidance" className="grid min-w-0 gap-4 md:grid-cols-2">
          {Object.entries(result).map(([key, values]) => <article className="panel min-w-0 [overflow-wrap:anywhere]" key={key}><h2 className="text-lg font-semibold">{aiLabels[key]}</h2><ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-7 text-slate-600">{values.map((value: string, index: number) => <li key={index}>{value}</li>)}</ul></article>)}
        </section>}
      </div>
    </>}
  </DashboardLayout>;
}
