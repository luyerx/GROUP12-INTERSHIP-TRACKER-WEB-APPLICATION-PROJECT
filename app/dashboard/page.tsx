import Link from "next/link";
import RecentApplications from "@/components/dashboard/RecentApplications";

import {
  BriefcaseBusiness,
  CalendarClock,
  CircleCheckBig,
  Clock3,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";

import ApplicationPipeline from "@/components/dashboard/ApplicationPipeline";
import UpcomingTasks from "@/components/dashboard/UpcomingTasks";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div>
        <p className="text-sm font-medium text-slate-500">
          Saturday, 15 August
        </p>

        <div className="mt-2 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Welcome back, Yanzhen
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Track applications, interviews, deadlines, and your overall
              internship progress.
            </p>
          </div>

            <Link
            href="/applications/new"
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
            Add application
            </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
                title="Total applications"
                value={12}
                helper="All tracked opportunities"
                icon={BriefcaseBusiness}
            />

            <StatCard
                title="Interviews"
                value={3}
                helper="Upcoming and completed"
                icon={CalendarClock}
            />

            <StatCard
                title="Offers"
                value={1}
                helper="Current successful outcomes"
                icon={CircleCheckBig}
            />

            <StatCard
                title="Upcoming deadlines"
                value={4}
                helper="Due within the next 14 days"
                icon={Clock3}
            />
            </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <ApplicationPipeline />
        <UpcomingTasks />
        </div>
       <div className="mt-6">
    <RecentApplications />
    </div>
            
    </DashboardLayout>
  );
}