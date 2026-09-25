import Link from "next/link";

import { ArrowUpRight, CalendarDays } from "lucide-react";

import { formatAppDateShort, toDateInputValue } from "@/lib/date";

import { aucklandDateKey, calendarDayDifference } from "@/lib/aucklandTime";

type Application = {
  id: string;
  organisation: string;
  roleTitle: string;
  deadline: string;
  status: string;
};

type UpcomingTasksProps = {
  applications: Application[];
};

export default function UpcomingTasks({ applications }: UpcomingTasksProps) {
  const today = aucklandDateKey();
  const upcomingTasks = applications
    .map((application) => ({ application, daysRemaining: calendarDayDifference(toDateInputValue(application.deadline), today) }))
    .filter(({ daysRemaining }) => daysRemaining >= 0 && daysRemaining <= 14)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 3);

  return (
    <section className="card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Upcoming tasks
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Application deadlines requiring your attention.
          </p>
        </div>

        <Link
          href="/calendar"
          className="flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-950"
        >
          View calendar
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 divide-y divide-slate-100">
        {upcomingTasks.map(({ application, daysRemaining }) => {

          return (
            <Link
              key={application.id}
              href={`/applications/${application.id}`}
              className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition group-hover:bg-white">
                <CalendarDays className="h-4 w-4" strokeWidth={1.8} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {application.organisation}
                </p>

                <p className="mt-1 truncate text-xs text-slate-500">
                  {application.roleTitle}
                </p>

                {daysRemaining !== null && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    {daysRemaining === 0
                      ? "Due today"
                      : daysRemaining === 1
                        ? "Due tomorrow"
                        : `Due in ${daysRemaining} days`}
                  </p>
                )}
              </div>

              <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                {formatAppDateShort(application.deadline)}
              </span>
            </Link>
          );
        })}

        {upcomingTasks.length === 0 && (
          <div className="py-8 text-center">
            <CalendarDays className="mx-auto h-5 w-5 text-slate-300" />

            <p className="mt-3 text-sm font-medium text-slate-700">
              No upcoming deadlines
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Nothing is due within the next 14 days.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
