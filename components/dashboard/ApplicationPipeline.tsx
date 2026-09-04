type Application = {
  id: string;
  status: string;
};

type ApplicationPipelineProps = {
  applications: Application[];
};

const pipelineStatuses = [
  "Interested",
  "Preparing",
  "Applied",
  "Interview",
  "Offer",
];

export default function ApplicationPipeline({
  applications,
}: ApplicationPipelineProps) {
  const totalApplications =
    applications.length;

  const pipelineData =
    pipelineStatuses.map(
      (status) => {
        const value =
          applications.filter(
            (application) =>
              application.status ===
              status
          ).length;

        const percentage =
          totalApplications === 0
            ? 0
            : Math.round(
                (value /
                  totalApplications) *
                  100
              );

        return {
          label: status,
          value,
          percentage,
        };
      }
    );

  const rejectedCount =
    applications.filter(
      (application) =>
        application.status ===
        "Rejected"
    ).length;

  const withdrawnCount =
    applications.filter(
      (application) =>
        application.status ===
        "Withdrawn"
    ).length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Application pipeline
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current progress across
            your tracked applications.
          </p>
        </div>

        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
          {totalApplications} total
        </span>
      </div>

      {totalApplications > 0 ? (
        <>
          <div className="mt-7 space-y-5">
            {pipelineData.map(
              (item) => (
                <div
                  key={
                    item.label
                  }
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      {
                        item.label
                      }
                    </span>

                    <span className="text-sm font-semibold tabular-nums text-slate-950">
                      {
                        item.value
                      }
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-900 transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              )
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
            <span className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700">
              Rejected{" "}
              {rejectedCount}
            </span>

            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-500">
              Withdrawn{" "}
              {withdrawnCount}
            </span>
          </div>
        </>
      ) : (
        <div className="flex min-h-72 flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-slate-700">
            No application data yet
          </p>

          <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
            Pipeline progress will
            appear after you add
            internship applications.
          </p>
        </div>
      )}
    </section>
  );
}
