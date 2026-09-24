"use client";

export default function ApplicationTimeline({ timelineItems }: { timelineItems: { title: string; subtitle: string; active: boolean }[] }) {
  return (<section className="card p-6">
    <h2 className="text-base font-semibold text-slate-950">
      Application Progress
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Based on your current status. This is a progress overview, not a record of past events.
    </p>

    <div className="mt-6 space-y-6">
      {timelineItems.map((item, index) => (
        <div
          key={`${item.title}-${index}`}
          className="relative flex gap-4"
        >
          {index < timelineItems.length - 1 && (
            <div className="absolute left-1.25 top-4 h-full w-px bg-slate-200" />
          )}

          <div
            className={`relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full ${item.active
                ? "bg-slate-950"
                : "border-2 border-slate-300 bg-white"
              }`}
          />

          <div className="pb-1">
            <p
              className={`text-sm font-medium ${item.active ? "text-slate-900" : "text-slate-700"
                }`}
            >
              {item.title}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {item.subtitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  </section>);
}
