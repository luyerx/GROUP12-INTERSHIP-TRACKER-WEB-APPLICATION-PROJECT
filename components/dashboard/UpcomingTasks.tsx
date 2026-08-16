import Link from "next/link";

import {
  BriefcaseBusiness,
  ArrowUpRight,
} from "lucide-react";

type Application = {
  id: number;
  organisation: string;
  roleTitle: string;
  deadline: string;
  status: string;
};

type UpcomingTasksProps = {
  applications: Application[];
};

function formatDeadline(deadline: string) {
  const date = new Date(`${deadline}T00:00:00`);

  return date.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
  });
}

export default function UpcomingTasks({
  applications,
}: UpcomingTasksProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const fourteenDaysFromNow = new Date(today);
  fourteenDaysFromNow.setDate(today.getDate() + 14);

  // Create tasks from application deadlines within the next 14 days.
  const upcomingTasks = applications
    .filter((application) => {
      if (!application.deadline) {
        return false;
      }

      const deadline = new Date(`${application.deadline}T00:00:00`);

      return deadline >= today && deadline <= fourteenDaysFromNow;
    })
    .sort((a, b) => {
      const firstDeadline = new Date(
        `${a.deadline}T00:00:00`
      ).getTime();

      const secondDeadline = new Date(
        `${b.deadline}T00:00:00`
      ).getTime();

      return firstDeadline - secondDeadline;
    })
    .slice(0, 3);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Upcoming tasks
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Deadlines and actions requiring your attention.
          </p>
        </div>

        <Link
          href="/applications"
          className="flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-950"
        >
          View all
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 divide-y divide-slate-100">
        {upcomingTasks.map((application) => (
          <Link
            key={application.id}
            href={`/applications/${application.id}`}
            className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
              <BriefcaseBusiness
                className="h-4 w-4"
                strokeWidth={1.8}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {application.organisation} {application.roleTitle}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Application deadline
              </p>
            </div>

            <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
              {formatDeadline(application.deadline)}
            </span>
          </Link>
        ))}

        {upcomingTasks.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">
            No upcoming deadlines.
          </p>
        )}
      </div>
    </section>
  );
}