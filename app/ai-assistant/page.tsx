"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Compass,
  Search,
  FileText,
  FilePenLine,
  MessagesSquare,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/Feedback";
import AIResults, { type OpportunityCard } from "@/components/ai/AIResults";
import {
  aiFeatureTitles,
  aiSchemas,
  needsApplication,
  type AIFeature,
  type AIResult,
} from "@/lib/ai-contract";
import { aucklandDateKey } from "@/lib/aucklandTime";

type Choice = { id: string; roleTitle: string; organisation: string };
type HistoryEntry = {
  id: string;
  applicationId?: string;
  feature: AIFeature;
  createdAt: string;
};
type Usage = {
  used: number;
  hardLimit: number;
  remaining: number;
  warning: boolean;
  reachedHardLimit: boolean;
};
const tools = [
  {
    feature: "opportunity-recommendation",
    icon: Compass,
    description:
      "Discover roles that may fit your skills and career interests.",
  },
  {
    feature: "smart-search",
    icon: Search,
    description: "Find real opportunities using your own words.",
  },
  {
    feature: "application-summary",
    icon: FileText,
    description: "Understand a saved role, its requirements and deadline.",
  },
  {
    feature: "document-assistant",
    icon: FilePenLine,
    description: "Improve your resume or cover letter for a chosen role.",
  },
  {
    feature: "interview-prep",
    icon: MessagesSquare,
    description: "Practise questions and plan evidence to share.",
  },
] as const;

export default function AIAssistantPage() {
  const [applications, setApplications] = useState<Choice[]>([]);
  const [applicationId, setApplicationId] = useState("");
  const [feature, setFeature] = useState<AIFeature>("interview-prep");
  const [query, setQuery] = useState("");
  const [documentType, setDocumentType] = useState("resume");
  const [documentText, setDocumentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [opportunities, setOpportunities] = useState<OpportunityCard[]>([]);
  const [totalResults, setTotalResults] = useState<number>();
  const [partialProfile, setPartialProfile] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [notice, setNotice] = useState("");
  const [usage, setUsage] = useState<Usage | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyError, setHistoryError] = useState("");
  const [historyBusy, setHistoryBusy] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [filterNow, setFilterNow] = useState(() => Date.now());
  const [reload, setReload] = useState(0);
  const pending = useRef<AbortController | null>(null);
  const appTool = needsApplication(feature);
  const valid =
    (!appTool || Boolean(applicationId)) &&
    (feature !== "smart-search" || query.trim().length >= 3) &&
    (feature !== "document-assistant" ||
      (documentText.trim().length >= 80 &&
        documentText.trim().length <= 10000));

  async function refreshUsage() {
    try {
      const response = await fetch("/api/ai/usage", { cache: "no-store" });
      const payload = await response.json();
      if (response.ok && payload.success) setUsage(payload.usage);
    } catch {
      /* Next generation refreshes usage. */
    }
  }
  async function refreshHistory() {
    try {
      const response = await fetch("/api/ai/history", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error();
      setHistory(payload.history);
      setHistoryError("");
    } catch {
      setHistoryError("Unable to load AI history. Please try again.");
    }
  }
  useEffect(() => {
    // Remove the previous unscoped browser cache; the authenticated server is authoritative.
    try {
      window.localStorage.removeItem("ai-assistant-history-v1");
    } catch {}
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const response = await fetch("/api/applications", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok || !payload.success || !Array.isArray(payload.data))
          throw new Error();
        setApplications(payload.data);
        const requested = new URLSearchParams(window.location.search).get(
          "applicationId",
        );
        setApplicationId(
          payload.data.some((app: Choice) => app.id === requested)
            ? requested!
            : "",
        );
        if (
          requested &&
          !payload.data.some((app: Choice) => app.id === requested)
        )
          setError(
            "The linked application is not available. Please choose one of your applications.",
          );
      } catch {
        if (!controller.signal.aborted)
          setLoadError("Unable to load your applications. Please try again.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          void refreshHistory();
          void refreshUsage();
        }
      }
    }
    void load();
    return () => {
      controller.abort();
      pending.current?.abort();
    };
  }, [reload]);
  function resetResult() {
    setResult(null);
    setOpportunities([]);
    setError("");
    setNotice("");
    setEmpty(false);
    setPartialProfile(false);
  }
  async function deleteHistory(id?: string) {
    if (historyBusy) return;
    setHistoryBusy(true);
    setHistoryError("");
    try {
      const response = await fetch("/api/ai/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : { clearAll: true }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error();
      setHistory((previous) =>
        id ? previous.filter((item) => item.id !== id) : [],
      );
    } catch {
      setHistoryError("History could not be deleted. Please try again.");
    } finally {
      setHistoryBusy(false);
    }
  }
  async function generate() {
    if (!valid || pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    resetResult();
    const timer = setTimeout(() => controller.abort(), 55000);
    const input =
      feature === "smart-search"
        ? { query }
        : feature === "opportunity-recommendation"
          ? {}
          : feature === "document-assistant"
            ? { applicationId, documentType, documentText }
            : { applicationId };
    try {
      const route =
        feature === "opportunity-recommendation"
          ? "opportunity-recommendations"
          : feature;
      const response = await fetch("/api/ai/" + route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      const payload = await response.json();
      if (payload.usage) setUsage(payload.usage);
      if (!response.ok || !payload.success)
        throw new Error(
          payload.message || "Unable to generate guidance. Please try again.",
        );
      setPartialProfile(Boolean(payload.partialProfile));
      if (payload.empty && feature === "opportunity-recommendation") {
        setEmpty(true);
        return;
      }
      const parsed = aiSchemas[feature].safeParse(payload.data);
      if (!parsed.success)
        throw new Error(
          "AI returned an unexpected response. Please try again.",
        );
      setResult(parsed.data);
      setOpportunities(payload.opportunities ?? []);
      setTotalResults(payload.totalResults);
      setNotice(payload.historyWarning ?? "");
      if (payload.history)
        setHistory((previous) => [payload.history, ...previous].slice(0, 8));
    } catch (failure) {
      setError(
        controller.signal.aborted
          ? "The request timed out. Please try again."
          : failure instanceof Error
            ? failure.message
            : "Unable to generate guidance.",
      );
    } finally {
      clearTimeout(timer);
      pending.current = null;
      setBusy(false);
      void refreshUsage();
    }
  }
  const filteredHistory = history.filter(
    (item) =>
      dateFilter === "all" ||
      (dateFilter === "this-month"
        ? aucklandDateKey(new Date(item.createdAt)).slice(0, 7) ===
          aucklandDateKey(new Date(filterNow)).slice(0, 7)
        : filterNow - new Date(item.createdAt).getTime() <=
          Number(dateFilter) * 86400000),
  );
  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Your next career step"
        title="AI Career Hub"
        description="Use AI-powered tools to discover opportunities, understand roles, improve applications and prepare for interviews."
      />
      <fieldset disabled={busy} className="mb-6">
        <legend className="sr-only">Choose a career tool</legend>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {tools.map(({ feature: value, icon: Icon, description }) => (
            <label
              key={value}
              className={
                "card flex min-w-0 cursor-pointer gap-3 p-4 " +
                (feature === value ? "border-teal-600 bg-teal-50" : "")
              }
            >
              <input
                className="mt-1 accent-teal-700"
                type="radio"
                name="ai-feature"
                checked={feature === value}
                onChange={() => {
                  setFeature(value);
                  resetResult();
                  setDocumentText("");
                }}
              />
              <span className="min-w-0">
                <Icon
                  className="mb-3 text-teal-700"
                  size={22}
                  aria-hidden="true"
                />
                <span className="block font-semibold">
                  {aiFeatureTitles[value]}
                </span>
                <span className="mt-2 block text-sm leading-6 text-slate-600">
                  {description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <section className="panel min-w-0">
        <h2 className="text-xl font-semibold">
          {feature === "application-summary"
            ? "AI Application Summary"
            : aiFeatureTitles[feature]}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {feature === "opportunity-recommendation"
            ? "Recommendations are based on your profile, tracked applications and currently available opportunities."
            : feature === "application-summary"
              ? "This summary is generated from your saved application snapshot."
              : feature === "document-assistant"
                ? "Get AI-generated suggestions for improving your resume or cover letter for a tracked opportunity."
                : tools.find((tool) => tool.feature === feature)?.description}
        </p>
        {appTool &&
          (loading ? (
            <LoadingState label="Loading your applications…" />
          ) : loadError ? (
            <ErrorState
              message={loadError}
              retry={() => setReload((value) => value + 1)}
            />
          ) : applications.length === 0 ? (
            <EmptyState
              title="Start with an application"
              description="Save an application before generating personalised guidance."
              action={
                <Link className="btn" href="/applications/new">
                  Add an application
                </Link>
              }
            />
          ) : (
            <div className="mt-5">
              <label className="form-label" htmlFor="ai-application">
                Application
              </label>
              <select
                id="ai-application"
                className="field min-w-0 max-w-full"
                value={applicationId}
                disabled={busy}
                onChange={(event) => {
                  setApplicationId(event.target.value);
                  resetResult();
                }}
              >
                <option value="">Choose an application</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.roleTitle} — {app.organisation}
                  </option>
                ))}
              </select>
            </div>
          ))}
        {feature === "smart-search" && (
          <div className="mt-5">
            <label className="form-label" htmlFor="ai-query">
              Describe the opportunity you want
            </label>
            <input
              id="ai-query"
              className="field"
              maxLength={500}
              value={query}
              disabled={busy}
              placeholder="Try: software internships in Auckland closing this month"
              onChange={(event) => {
                setQuery(event.target.value);
                resetResult();
              }}
            />
          </div>
        )}
        {feature === "document-assistant" && (
          <div className="mt-5 space-y-4">
            <div>
              <label className="form-label" htmlFor="document-type">
                Document type
              </label>
              <select
                id="document-type"
                className="field"
                disabled={busy}
                value={documentType}
                onChange={(event) => {
                  setDocumentType(event.target.value);
                  resetResult();
                }}
              >
                <option value="resume">Resume</option>
                <option value="cover-letter">Cover Letter</option>
              </select>
            </div>
            <div>
              <label className="form-label" htmlFor="document-text">
                Paste your document text here
              </label>
              <textarea
                id="document-text"
                className="field min-h-52"
                disabled={busy}
                maxLength={10000}
                value={documentText}
                onChange={(event) => {
                  setDocumentText(event.target.value);
                  resetResult();
                }}
                aria-describedby="document-help"
              />
              <p id="document-help" className="mt-2 text-sm text-slate-500">
                80–10,000 characters ·{" "}
                {documentText.trim().length.toLocaleString()} entered. Remove
                contact details before submitting.
              </p>
            </div>
            <p className="text-sm text-slate-600">
              Your original document text is used for the current request and is
              not stored in AI history. Guidance may contain short excerpts. AI
              suggestions should be reviewed and edited by the user before use.
            </p>
          </div>
        )}
        <p className="mt-5 text-sm leading-6 text-slate-600">
          Relevant tool inputs are sent to Google Gemini. Generated guidance is
          saved to your AI history for later review and can be deleted by you.
          Smart Search saves only the interpreted filters. Verify AI guidance
          against the job listing.
        </p>
        {feature === "opportunity-recommendation" && (
          <p className="mt-2 text-sm text-slate-600">
            AI recommendations are guidance only and do not represent hiring
            probability.
          </p>
        )}
        <div className="page-actions mt-4">
          <button
            className="btn"
            disabled={
              !valid ||
              busy ||
              (appTool && (loading || !!loadError)) ||
              usage?.reachedHardLimit
            }
            onClick={() => void generate()}
          >
            {busy
              ? "Generating…"
              : feature === "smart-search"
                ? "Search with AI"
                : "Generate"}
          </button>
          <Link className="btn-secondary" href="/profile">
            Review profile
          </Link>
        </div>
      </section>
      <div className="mt-6 space-y-4" aria-live="polite" aria-busy={busy}>
        {busy && <LoadingState label="Preparing your personalised guidance…" />}
        {error && (
          <ErrorState
            title="Guidance unavailable"
            message={error}
            retry={!busy && valid ? () => void generate() : undefined}
          />
        )}
        {notice && (
          <p role="status" className="panel text-sm text-amber-700">
            {notice}
          </p>
        )}
        {partialProfile && (
          <p className="panel text-sm text-slate-600">
            Complete more of your profile to improve recommendation quality.{" "}
            <Link href="/profile" className="text-teal-700 underline">
              Review profile
            </Link>
          </p>
        )}
        {empty && (
          <EmptyState
            title="No opportunities available"
            description="There are no currently discoverable opportunities. Check back when new roles are published."
          />
        )}
        {result && (
          <AIResults
            feature={feature}
            result={result}
            opportunities={opportunities}
            totalResults={totalResults}
          />
        )}
      </div>
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_2fr]">
        <section className="panel">
          <h2 className="text-lg font-semibold">Monthly AI usage</h2>
          {usage ? (
            <>
              <p className="mt-3 text-sm text-slate-600">
                {usage.used} / {usage.hardLimit} requests used ·{" "}
                {usage.remaining} remaining
              </p>
              <progress
                className="mt-4 h-2 w-full accent-teal-700"
                value={usage.used}
                max={usage.hardLimit}
                aria-label="Monthly requests used"
              />
              <p className="mt-3 text-xs text-slate-500">
                Resets each calendar month in Pacific/Auckland. Failed provider
                attempts count; internal retries count once.
              </p>
              {usage.warning && (
                <p className="mt-3 text-sm text-amber-700">
                  {usage.reachedHardLimit
                    ? "You have reached the monthly AI limit. Please try again next month."
                    : "You are approaching the monthly AI limit."}
                </p>
              )}
            </>
          ) : (
            <button
              className="btn-secondary mt-3"
              onClick={() => void refreshUsage()}
            >
              Load usage
            </button>
          )}
        </section>
        <section className="panel min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Recent history</h2>
            {history.length > 0 && (
              <button
                className="btn-secondary btn-small"
                disabled={historyBusy}
                onClick={() => void deleteHistory()}
              >
                Clear all
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Your eight most recent saved results.
          </p>
          <div className="my-4 flex flex-wrap gap-2">
            {[
              ["all", "All time"],
              ["7", "Last 7 days"],
              ["30", "Last 30 days"],
              ["this-month", "This month"],
            ].map(([value, label]) => (
              <button
                key={value}
                aria-pressed={dateFilter === value}
                className={
                  "rounded-lg px-3 py-2 text-sm " +
                  (dateFilter === value
                    ? "bg-teal-700 text-white"
                    : "bg-slate-100 text-slate-700")
                }
                onClick={() => {
                  setDateFilter(value);
                  setFilterNow(Date.now());
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {historyError && (
            <ErrorState
              message={historyError}
              retry={() => void refreshHistory()}
            />
          )}
          {!filteredHistory.length && (
            <p className="text-sm text-slate-500">
              No AI history matches this date range.
            </p>
          )}
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3"
              >
                <Link
                  href={"/ai-assistant/history/" + item.id}
                  className="min-w-0 flex-1"
                >
                  <p className="font-medium">
                    {aiFeatureTitles[item.feature] ?? item.feature}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {applications.find((app) => app.id === item.applicationId)
                      ?.roleTitle ??
                      (item.applicationId
                        ? "Saved application"
                        : "Opportunity discovery")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleString("en-NZ", {
                      timeZone: "Pacific/Auckland",
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </Link>
                <button
                  className="btn-secondary btn-small"
                  disabled={historyBusy}
                  aria-label={"Delete " + aiFeatureTitles[item.feature]}
                  onClick={() => void deleteHistory(item.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
