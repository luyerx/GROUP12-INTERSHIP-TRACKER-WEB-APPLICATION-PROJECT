import {
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  ArrowUpRight,
} from "lucide-react";

const tasks = [
  {
    title: "Google Software Engineering Intern",
    description: "Application deadline",
    date: "18 Aug",
    icon: BriefcaseBusiness,
  },
  {
    title: "Microsoft Cloud Internship",
    description: "Technical interview",
    date: "20 Aug",
    icon: CalendarDays,
  },
  {
    title: "Xero Graduate Developer",
    description: "Send follow-up email",
    date: "22 Aug",
    icon: Clock3,
  },
];

export default function UpcomingTasks() {
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

        <button className="flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-950">
          View all
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 divide-y divide-slate-100">
        {tasks.map((task) => {
          const Icon = task.icon;

          return (
            <div
              key={task.title}
              className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500">
                <Icon className="h-4 w-4" strokeWidth={1.8} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {task.title}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {task.description}
                </p>
              </div>

              <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                {task.date}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}