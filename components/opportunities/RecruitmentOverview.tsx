import Link from "next/link";
import {
  BriefcaseBusiness,
  FileText,
  CircleCheckBig,
  CalendarClock,
} from "lucide-react";
import type { Opportunity } from "@/lib/opportunity";
import { todayDate } from "@/lib/opportunity";
import StatCard from "@/components/dashboard/StatCard";
import CompanyMark from "@/components/ui/CompanyMark";
import StatusBadge from "@/components/ui/StatusBadge";
import Deadline from "@/components/ui/Deadline";
import PageHeader from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/Feedback";
export default function RecruitmentOverview({
  name,
  rows,
}: {
  name: string;
  rows: Opportunity[];
}) {
  const today = todayDate();
  const week = new Date(today + "T00:00:00Z");
  week.setUTCDate(week.getUTCDate() + 7);
  const weekEnd = week.toISOString().slice(0, 10);
  const open = rows.filter(
    (r) => r.status === "Published" && r.closingDate >= today,
  );
  const soon = open.filter((r) => r.closingDate <= weekEnd);
  const recent = [...rows]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);
  return (
    <>
      <PageHeader
        eyebrow="Recruitment overview"
        title={"Welcome, " + name.split(" ")[0]}
        description="Create opportunities that help students take their next career step."
        action={
          <Link className="btn" href="/employee/opportunities/new">
            Create Opportunity
          </Link>
        }
      />
      <section className="next-actions mb-6" aria-label="Recruitment quick actions">
        <div><p className="eyebrow">Recruitment desk</p><h2 className="mt-2 text-xl font-semibold">Keep your next hire moving.</h2></div>
        <div className="flex flex-wrap gap-3"><Link className="btn-secondary" href="/employee/opportunities">Review listings →</Link><Link className="btn-secondary" href="/employee/profile">Update company profile →</Link></div>
        {soon.length > 0 && <div><h3 className="text-sm font-semibold">Closing within 7 days</h3><ul className="mt-2 divide-y divide-teal-200">{[...soon].sort((a,b) => a.closingDate.localeCompare(b.closingDate)).map(row => <li key={row.id}><Link className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm font-medium" href={"/employee/opportunities/" + row.id}><span>{row.role} →</span><Deadline value={row.closingDate} /></Link></li>)}</ul></div>}
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="All listings"
          value={rows.length}
          helper="Your opportunity portfolio"
          icon={BriefcaseBusiness}
        />
        <StatCard
          title="Open published roles"
          value={open.length}
          helper="Currently open for discovery"
          icon={CircleCheckBig}
        />
        <StatCard
          title="Drafts to finish"
          value={rows.filter((r) => r.status === "Draft").length}
          helper="Private until published"
          icon={FileText}
        />
        <StatCard
          title="Closing soon"
          value={soon.length}
          helper="Due within the next 7 days"
          icon={CalendarClock}
        />
      </section>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <section className="panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Recent opportunities</h2>
              <p className="mt-1 text-sm text-slate-500">
                Keep your listings clear and current.
              </p>
            </div>
            <Link
              className="text-sm font-semibold text-teal-700"
              href="/employee/opportunities"
            >
              View all →
            </Link>
          </div>
          {recent.length ? (
            <div className="mt-5 divide-y divide-slate-100">
              {recent.map((row) => (
                <Link
                  href={"/employee/opportunities/" + row.id}
                  key={row.id}
                  className="flex flex-wrap items-center gap-3 py-4"
                >
                  <CompanyMark name={row.organisation} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm">{row.role}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.organisation} · {row.location}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <StatusBadge value={row.status} />
                    <div>
                      <Deadline value={row.closingDate} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="Ready for your first listing?"
                description="Start with a draft and add the details students need to decide if the role is right for them."
                action={
                  <Link className="btn" href="/employee/opportunities/new">
                    Create Opportunity
                  </Link>
                }
              />
            </div>
          )}
        </section>
        <aside className="space-y-5">
          <section className="support-section">
            <p className="eyebrow">Publishing checklist</p>
            <h2 className="mt-2 text-lg font-semibold">
              Make each listing useful.
            </h2>
            <ol className="mt-5 space-y-4">
              {[
                "Complete your company profile.",
                "Describe the role and eligibility.",
                "Add application instructions and a closing date.",
                "Close the listing when recruitment finishes.",
              ].map((text, i) => (
                <li
                  key={text}
                  className="flex gap-3 text-sm leading-6 text-slate-600"
                >
                  <span className="font-semibold text-teal-700">0{i + 1}</span>
                  {text}
                </li>
              ))}
            </ol>
            <Link
              className="btn-secondary mt-6 w-full"
              href="/employee/profile"
            >
              Company Profile →
            </Link>
          </section>
          <section className="rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold">
              Keep the application route clear
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Students track roles here and apply through your instructions.
              Provide a direct employer application link when available.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
