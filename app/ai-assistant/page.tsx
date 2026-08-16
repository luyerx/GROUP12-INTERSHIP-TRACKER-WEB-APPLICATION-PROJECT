"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function AiAssistantPage() {
  const [description, setDescription] = useState("");
  const [summary, setSummary] = useState("");
  const generate = () => {
    const sentences = description.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
    setSummary(sentences.slice(0, 3).join(" ") || "Not mentioned.");
  };
  return <DashboardLayout><div><p className="text-sm font-medium text-slate-500">Preparation workspace</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">AI assistant</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Create an editable short summary from a job advertisement. Always review generated text before using it.</p></div><div className="mt-8 grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-semibold text-slate-950">Job description</h2><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={14} placeholder="Paste the job description here..." className="mt-4 w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-slate-400"/><button onClick={generate} disabled={!description.trim()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"><Sparkles className="h-4 w-4"/>Generate draft</button></section><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-semibold text-slate-950">Editable summary</h2><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">Generated — review required</span></div><textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={14} placeholder="Your generated or manual summary will appear here..." className="mt-4 w-full resize-none rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-slate-400"/><p className="mt-3 text-xs leading-5 text-slate-500">This MVP uses local extractive summarisation and sends no job text to an external service.</p></section></div></DashboardLayout>;
}
