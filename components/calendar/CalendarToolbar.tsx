"use client";
import {
  ChevronLeft,
  ChevronRight,
  Plus
} from "lucide-react";

export default function CalendarToolbar({ openCreateEvent, applications, isLoadingApplications, goToToday, goToPreviousMonth, goToNextMonth }: { openCreateEvent: () => void; applications: { id: string }[]; isLoadingApplications: boolean; goToToday: () => void; goToPreviousMonth: () => void; goToNextMonth: () => void }) {
  return (<div className="flex flex-wrap items-center gap-2">
    <button
      type="button"
      onClick={openCreateEvent}
      disabled={applications.length === 0 || isLoadingApplications}
      className="btn disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Plus className="h-4 w-4" />
      Add event
    </button>

    <button
      type="button"
      onClick={goToToday}
      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
    >
      Today
    </button>

    <button
      type="button"
      onClick={goToPreviousMonth}
      aria-label="Previous month"
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
    >
      <ChevronLeft className="h-4 w-4" />
    </button>

    <button
      type="button"
      onClick={goToNextMonth}
      aria-label="Next month"
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
    >
      <ChevronRight className="h-4 w-4" />
    </button>
  </div>);
}
