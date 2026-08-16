"use client";

<<<<<<< HEAD
import { useEffect, useState } from "react";
import Link from "next/link";

import {
  BriefcaseBusiness,
  CalendarClock,
  CircleCheckBig,
  Clock3,
} from "lucide-react";

=======
import Link from "next/link";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, CalendarClock, CircleCheckBig, Clock3 } from "lucide-react";
import type { Application } from "@/lib/application";
>>>>>>> c32dc60 (Complete database setup and improve frontend)
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import ApplicationPipeline from "@/components/dashboard/ApplicationPipeline";
import UpcomingTasks from "@/components/dashboard/UpcomingTasks";
import RecentApplications from "@/components/dashboard/RecentApplications";
<<<<<<< HEAD

type Application = {
  id: number;
  organisation: string;
  roleTitle: string;
  location: string;
  deadline: string;
  status: string;
};

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApplications() {
      try {
        const response = await fetch("/api/applications");
        const result = await response.json();

        if (response.ok && result.success) {
          setApplications(result.data);
        } else {
          console.error("Failed to load applications.");
        }
      } catch (error) {
        console.error("Failed to load dashboard applications:", error);
      } finally {
        setLoading(false);
      }
    }

    loadApplications();
  }, []);

  // Total number of applications.
  const totalApplications = applications.length;

  // Applications currently at the Interview stage.
  const interviewCount = applications.filter(
    (application) => application.status === "Interview"
  ).length;

  // Applications currently at the Offer stage.
  const offerCount = applications.filter(
    (application) => application.status === "Offer"
  ).length;

  // Applications with deadlines within the next 14 days.
  const upcomingDeadlineCount = applications.filter((application) => {
    if (!application.deadline) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = new Date(`${application.deadline}T00:00:00`);

    const fourteenDaysFromNow = new Date(today);
    fourteenDaysFromNow.setDate(today.getDate() + 14);

    return deadline >= today && deadline <= fourteenDaysFromNow;
  }).length;

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
            value={loading ? "—" : totalApplications}
            helper="All tracked opportunities"
            icon={BriefcaseBusiness}
          />

          <StatCard
            title="Interviews"
            value={loading ? "—" : interviewCount}
            helper="Upcoming and completed"
            icon={CalendarClock}
          />

          <StatCard
            title="Offers"
            value={loading ? "—" : offerCount}
            helper="Current successful outcomes"
            icon={CircleCheckBig}
          />

          <StatCard
            title="Upcoming deadlines"
            value={loading ? "—" : upcomingDeadlineCount}
            helper="Due within the next 14 days"
            icon={Clock3}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <ApplicationPipeline applications={applications} />

        <UpcomingTasks applications={applications} />
      </div>

      <div className="mt-6">
        <RecentApplications applications={applications} />
      </div>
    </DashboardLayout>
  );
}
=======

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState("");
  const [today] = useState(() => new Date());
  useEffect(() => { fetch("/api/applications").then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.message); setApplications(result.data); }).catch(() => setError("Dashboard data could not be loaded.")); }, []);
  const deadlineCutoff = today.getTime() + 14 * 24 * 60 * 60 * 1000;
  const upcoming = applications.filter((item) => { const time = new Date(`${item.deadline}T23:59:59`).getTime(); return item.deadline && time >= today.getTime() && time <= deadlineCutoff; }).length;
  return <DashboardLayout><div><p className="text-sm text-slate-500">{today.toLocaleDateString("en-NZ", { weekday: "long", day: "numeric", month: "long" })}</p><div className="mt-2 flex items-start justify-between gap-6"><div><h1 className="text-2xl font-semibold tracking-tight text-slate-950">Dashboard</h1><p className="mt-1 text-sm text-slate-500">Applications, interviews, and deadlines.</p></div><Link href="/applications/new" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Add application</Link></div>{error && <p className="mt-5 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}<div className="mt-6 grid grid-cols-2 gap-x-6 lg:grid-cols-4"><StatCard title="Applications" value={applications.length} helper="Total" icon={BriefcaseBusiness}/><StatCard title="Interviews" value={applications.filter((item) => item.status === "Interview").length} helper="Current" icon={CalendarClock}/><StatCard title="Offers" value={applications.filter((item) => item.status === "Offer").length} helper="Current" icon={CircleCheckBig}/><StatCard title="Deadlines" value={upcoming} helper="Next 14 days" icon={Clock3}/></div></div><div className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]"><ApplicationPipeline applications={applications}/><UpcomingTasks applications={applications}/></div><div className="mt-5"><RecentApplications applications={applications}/></div></DashboardLayout>;
}
>>>>>>> c32dc60 (Complete database setup and improve frontend)
