"use client";
import { Application } from "@/components/applications/detailTypes";
import {
  UserRound
} from "lucide-react";

export default function ApplicationContact({ application }: { application: Application }) {
  return (<section className="card p-6">
    <div className="flex items-center gap-3">
      <UserRound className="h-5 w-5 text-slate-500" />

      <h2 className="text-base font-semibold text-slate-950">
        Contact
      </h2>
    </div>

    <p className="mt-5 text-sm font-medium text-slate-800">
      {application.contactPerson || "No contact added"}
    </p>

    <p className="mt-1 text-xs text-slate-500">
      Recruiter / hiring contact
    </p>
  </section>);
}
