"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { aiFeatureTitles, type AIFeature } from "@/lib/ai-contract";
import PageHeader from "@/components/ui/PageHeader";
import { ErrorState, LoadingState } from "@/components/ui/Feedback";

type AIUsageItem = {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  totalRequests: number;
  lastUsedAt: string;
  features: string[];
};

type AIUsageSummary = {
  totalUsers: number;
  totalRequests: number;
  recent: AIUsageItem[];
  usage: AIUsageItem[];
};

function formatDateTime(value?: string) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleString("en-NZ", { timeZone: "Pacific/Auckland", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function AdminAIUsagePage() {
  const [summary, setSummary] = useState<AIUsageSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/ai-usage", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Unable to load AI usage records.");
      }

      setSummary(payload.data);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Unable to load AI usage records."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      try {
        const response = await fetch("/api/admin/ai-usage", {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(
            payload.message || "Unable to load AI usage records."
          );
        }

        if (!cancelled) {
          setSummary(payload.data);
        }
      } catch (failure) {
        if (!cancelled) {
          setError(
            failure instanceof Error
              ? failure.message
              : "Unable to load AI usage records."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInitial();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mt-6">
        <LoadingState label="Loading AI usage records…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6">
        <ErrorState message={error} retry={() => void load()} />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Platform analytics"
        title="AI Usage Overview"
        description="Review up to 100 students with the most saved AI history. Counts exclude deleted history and failed requests; monthly quotas are tracked separately."
      />

      {summary && (
        <>
          <div className="my-6 grid gap-4 md:grid-cols-2">
            <section className="panel">
              <p className="eyebrow">Total users with AI usage</p>
              <div className="mt-2 text-3xl font-semibold">{summary.totalUsers}</div>
            </section>
            <section className="panel">
              <p className="eyebrow">Saved history records</p>
              <div className="mt-2 text-3xl font-semibold">{summary.totalRequests}</div>
            </section>
          </div>

          <section className="panel">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">AI usage by user</h2>
              <Link href="/admin/dashboard" className="btn-secondary">Back to dashboard</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="px-3 py-2">User</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Saved records</th>
                    <th className="px-3 py-2">Features</th>
                    <th className="px-3 py-2">Last used</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.usage.map((item) => (
                    <tr key={item.userId} className="border-b border-slate-200 align-top">
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-900">{item.fullName}</div>
                        <div className="text-xs text-slate-500">{item.email}</div>
                      </td>
                      <td className="px-3 py-3 capitalize text-slate-700">{item.role}</td>
                      <td className="px-3 py-3 font-semibold text-slate-900">{item.totalRequests}</td>
                      <td className="px-3 py-3 text-slate-700">{item.features.map(feature => aiFeatureTitles[feature as AIFeature] ?? feature).join(", ") || "—"}</td>
                      <td className="px-3 py-3 text-slate-700">{formatDateTime(item.lastUsedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
