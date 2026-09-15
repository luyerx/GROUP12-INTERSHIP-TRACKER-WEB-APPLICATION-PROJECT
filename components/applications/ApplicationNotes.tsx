"use client";
import { Application } from "@/components/applications/detailTypes";

export default function ApplicationNotes({ application }: { application: Application }) {
  return (<section className="card p-6">
    <h2 className="text-base font-semibold text-slate-950">Notes</h2>

    <p className="mt-1 text-sm text-slate-500">
      Personal preparation and follow-up information.
    </p>

    <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
      {application.notes || "No notes added."}
    </div>
  </section>);
}
