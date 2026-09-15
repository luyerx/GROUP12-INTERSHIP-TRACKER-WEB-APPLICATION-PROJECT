"use client";
import { Application, ApplicationStatus } from "@/components/applications/detailTypes";
import {
  LoaderCircle
} from "lucide-react";

export default function ApplicationProgress({ application, status, isUpdatingStatus, statusError, handleStatusChange, validStatuses, formatDeadline }: { application: Application; status: ApplicationStatus; isUpdatingStatus: boolean; statusError: string; handleStatusChange: (status: ApplicationStatus) => Promise<void>; validStatuses: ApplicationStatus[]; formatDeadline: (deadline: string) => string }) {
  return (<section className="card p-6">
    <h2 className="text-base font-semibold text-slate-950">
      Application details
    </h2>

    <div className="mt-5 space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Status
        </p>

        <select aria-label="Application status"
          value={status}
          disabled={isUpdatingStatus}
          onChange={(event) =>
            void handleStatusChange(
              event.target.value as ApplicationStatus,
            )
          }
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {validStatuses.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        {isUpdatingStatus && (
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            Updating status...
          </div>
        )}

        {statusError && (
          <p role="alert" className="mt-2 text-xs leading-5 text-rose-600">
            {statusError}
          </p>
        )}
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Deadline
        </p>

        <p className="mt-1.5 text-sm font-medium text-slate-800">
          {formatDeadline(application.deadline)}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Location
        </p>

        <p className="mt-1.5 text-sm font-medium text-slate-800">
          {application.location || "Not set"}
        </p>
      </div>
    </div>
  </section>);
}
