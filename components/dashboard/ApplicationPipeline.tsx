const pipelineData = [
  { label: "Interested", value: 2, percentage: 17 },
  { label: "Preparing", value: 2, percentage: 17 },
  { label: "Applied", value: 4, percentage: 33 },
  { label: "Interview", value: 3, percentage: 25 },
  { label: "Offer", value: 1, percentage: 8 },
];

export default function ApplicationPipeline() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Application pipeline
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current progress across your tracked applications.
          </p>
        </div>

        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
          12 total
        </span>
      </div>

      <div className="mt-7 space-y-5">
        {pipelineData.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                {item.label}
              </span>

              <span className="text-sm font-semibold tabular-nums text-slate-950">
                {item.value}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-900 transition-all duration-500"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}