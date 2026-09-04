import Link from "next/link";

import {
  ArrowUpRight,
  BriefcaseBusiness,
} from "lucide-react";

import { formatAppDateShort } from "@/lib/date";

type Application = {
  id: string;
  organisation: string;
  roleTitle: string;
  location: string;
  deadline: string;
  status: string;
};

type RecentApplicationsProps = {
  applications: Application[];
};

const statusStyles: Record<
  string,
  string
> = {
  Interested:
    "bg-slate-100 text-slate-700 ring-slate-600/20",

  Preparing:
    "bg-violet-50 text-violet-700 ring-violet-600/20",

  Applied:
    "bg-blue-50 text-blue-700 ring-blue-600/20",

  Interview:
    "bg-amber-50 text-amber-700 ring-amber-600/20",

  Offer:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20",

  Rejected:
    "bg-red-50 text-red-700 ring-red-600/20",

  Withdrawn:
    "bg-slate-100 text-slate-500 ring-slate-500/20",
};

export default function RecentApplications({
  applications,
}: RecentApplicationsProps) {
  const recentApplications = [
    ...applications,
  ]
    .slice(-3)
    .reverse();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Recent applications
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Recently added internship
            opportunities in your tracker.
          </p>
        </div>

        <Link
          href="/applications"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-950"
        >
          View all

          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {recentApplications.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 text-left">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="px-6 py-3.5">
                  Company
                </th>

                <th className="px-6 py-3.5">
                  Role
                </th>

                <th className="px-6 py-3.5">
                  Location
                </th>

                <th className="px-6 py-3.5">
                  Deadline
                </th>

                <th className="px-6 py-3.5">
                  Status
                </th>

                <th className="w-16 px-6 py-3.5" />
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {recentApplications.map(
                (application) => (
                  <tr
                    key={application.id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                          {application.organisation
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <Link
                          href={`/applications/${application.id}`}
                          className="text-sm font-medium text-slate-900 transition hover:text-slate-600"
                        >
                          {
                            application.organisation
                          }
                        </Link>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {
                        application.roleTitle
                      }
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {application.location ||
                        "Not set"}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatAppDateShort(
                        application.deadline
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                          statusStyles[
                            application
                              .status
                          ] ??
                          "bg-slate-100 text-slate-700 ring-slate-600/20"
                        }`}
                      >
                        {
                          application.status
                        }
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/applications/${application.id}`}
                        aria-label={`View ${application.organisation} application`}
                        className="inline-flex rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <BriefcaseBusiness className="h-5 w-5" />
          </div>

          <h3 className="mt-4 text-sm font-semibold text-slate-900">
            No applications yet
          </h3>

          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
            Add an internship opportunity
            and it will appear here.
          </p>

          <Link
            href="/applications/new"
            className="mt-4 text-sm font-medium text-slate-950 transition hover:text-slate-600"
          >
            Add application
          </Link>
        </div>
      )}
    </section>
  );
}