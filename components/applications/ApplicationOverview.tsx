"use client";
import { Application } from "@/components/applications/detailTypes";
import {
  BriefcaseBusiness,
  ExternalLink
} from "lucide-react";

export default function ApplicationOverview({ application }: { application: Application }) {
  return (<section className="card p-6">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <BriefcaseBusiness className="h-5 w-5" />
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-950">
          Job description
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Original details saved with this application.
        </p>
      </div>
    </div>

    <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-600">
      {application.jobDescription || "No job description added."}
    </p>

    {application.sourceLink && (
      <a
        href={application.sourceLink}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
      >
        View original job posting
        <ExternalLink className="h-4 w-4" />
      </a>
    )}
  </section>);
}
