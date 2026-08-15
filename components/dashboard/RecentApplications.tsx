import { MoreHorizontal } from "lucide-react";

const applications = [
  {
    company: "Google",
    role: "Software Engineering Intern",
    location: "Auckland",
    deadline: "18 Aug",
    status: "Applied",
    initials: "G",
  },
  {
    company: "Microsoft",
    role: "Cloud Internship",
    location: "Wellington",
    deadline: "20 Aug",
    status: "Interview",
    initials: "M",
  },
  {
    company: "Xero",
    role: "Graduate Developer",
    location: "Auckland",
    deadline: "22 Aug",
    status: "Preparing",
    initials: "X",
  },
];

const statusStyles: Record<string, string> = {
  Applied: "bg-blue-50 text-blue-700 ring-blue-600/20",
  Interview: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Preparing: "bg-violet-50 text-violet-700 ring-violet-600/20",
};

export default function RecentApplications() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Recent applications
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your most recently updated internship applications.
          </p>
        </div>

        <button className="text-sm font-medium text-slate-500 transition hover:text-slate-950">
          View all applications
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-400">
              <th className="px-6 py-3.5">Company</th>
              <th className="px-6 py-3.5">Role</th>
              <th className="px-6 py-3.5">Location</th>
              <th className="px-6 py-3.5">Deadline</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="w-12 px-6 py-3.5" />
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {applications.map((application) => (
              <tr
                key={application.company}
                className="transition-colors hover:bg-slate-50/80"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                      {application.initials}
                    </div>

                    <span className="text-sm font-medium text-slate-900">
                      {application.company}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 text-sm text-slate-700">
                  {application.role}
                </td>

                <td className="px-6 py-4 text-sm text-slate-500">
                  {application.location}
                </td>

                <td className="px-6 py-4 text-sm text-slate-500">
                  {application.deadline}
                </td>

                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                      statusStyles[application.status]
                    }`}
                  >
                    {application.status}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <button className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}