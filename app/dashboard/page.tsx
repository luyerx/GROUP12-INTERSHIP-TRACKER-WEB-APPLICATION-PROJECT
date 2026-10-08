"use client";
import CareerIllustration from "@/components/visual/CareerIllustration";
import PageHeader from "@/components/ui/PageHeader";

import { LoadingState } from "@/components/ui/Feedback";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarClock,
  CircleCheckBig,
  Clock3,
  RefreshCw,
} from "lucide-react";

import ApplicationPipeline from "@/components/dashboard/ApplicationPipeline";
import RecentApplications from "@/components/dashboard/RecentApplications";
import StatCard from "@/components/dashboard/StatCard";
import UpcomingInterviews from "@/components/dashboard/UpcomingInterviews";
import UpcomingTasks from "@/components/dashboard/UpcomingTasks";
import DashboardLayout from "@/components/layout/DashboardLayout";
import OpportunityBrowser from "@/components/opportunities/OpportunityBrowser";

import { toDateInputValue, formatAppDate } from "@/lib/date";
import { aucklandDateKey, calendarDayDifference, BUSINESS_TIME_ZONE } from "@/lib/aucklandTime";

type ApplicationStatus =
  | "Interested"
  | "Preparing"
  | "Applied"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Withdrawn";

type Application = {
  id: string;
  organisation: string;
  roleTitle: string;
  location: string;
  deadline: string;
  status: ApplicationStatus;
};

type ApplicationsApiResponse = {
  success: boolean;
  data?: Application[];
  message?: string;
};

type CurrentUserResponse = {
  success: boolean;
  user?: { fullName: string };
};

async function fetchApplications(): Promise<Application[]> {
  const response = await fetch("/api/applications", {
    method: "GET",
    cache: "no-store",
  });

  const result: ApplicationsApiResponse = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to load applications.");
  }

  return Array.isArray(result.data) ? result.data : [];
}

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [userName, setUserName] = useState("there");

  useEffect(() => {
    let cancelled = false;

    const initialiseDashboard = async () => {
      try {
        const data = await fetchApplications();

        if (!cancelled) {
          setApplications(data);
        }
      } catch (error) {
        console.error("Failed to load dashboard applications:", error);

        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load dashboard data.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void initialiseDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const result: CurrentUserResponse = await response.json();

        if (!cancelled && response.ok && result.success && result.user) {
          setUserName(result.user.fullName.split(" ")[0] || "there");
        }
      } catch (error) {
        console.error("Failed to load current user:", error);
      }
    };

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const retryDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchApplications();

      setApplications(data);
    } catch (error) {
      console.error("Failed to load dashboard applications:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  };

  const today = aucklandDateKey();
  const dashboardStats = useMemo(() => {
    const totalApplications = applications.length;

    const interviewCount = applications.filter(
      (application) => application.status === "Interview",
    ).length;

    const offerCount = applications.filter(
      (application) => application.status === "Offer",
    ).length;

    const upcomingDeadlineCount = applications.filter((application) => {
      const key = toDateInputValue(application.deadline);
      const days = key ? calendarDayDifference(key, today) : NaN;
      return days >= 0 && days <= 14;
    }).length;

    return {
      totalApplications,
      interviewCount,
      offerCount,
      upcomingDeadlineCount,
    };
  }, [applications, today]);

  const nextDeadline = applications
    .filter((a) => a.status === "Interested" || a.status === "Preparing")
    .map((application) => ({ application, date: toDateInputValue(application.deadline) }))
    .filter((item) => item.date && item.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const currentDateLabel = new Date().toLocaleDateString("en-NZ", {
    timeZone: BUSINESS_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <DashboardLayout>
      <div>
        {/* Header */}


        <PageHeader eyebrow={currentDateLabel} title={<>Welcome back, {userName}</>} description="Track applications, interviews, deadlines, and your overall internship progress." action={<Link href="/opportunities" className="btn ">
          Browse Opportunities
        </Link>} />

        <section className="workspace-welcome" aria-label="Your career workspace">
          <div><p className="eyebrow">Make room for your next move</p><h2>A little focus goes a long way.</h2><p>Review a role, prepare an example, or plan your week. Start with what matters today.</p><Link href="/ai-assistant" className="text-link">Prepare with AI →</Link></div>
          <CareerIllustration variant="planner" />
        </section>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mt-6 flex flex-col gap-4 rounded-2xl border border-rose-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertCircle className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Unable to load dashboard
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">{error}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void retryDashboard()}
              className="btn "
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        )}

        {!loading && !error && applications.length === 0 && (
          <section className="hero mt-6">
            <p className="eyebrow">Your next chapter starts here</p>
            <h2 className="mt-3 text-2xl font-semibold">
              Discover your first internship.
            </h2>
            <p className="mt-3 max-w-xl">
              Browse published roles, save one to My Applications, then track
              preparation, interviews and offers. Tracking saves a personal
              record; apply through the employer’s instructions.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link className="btn" href="/opportunities">
                Browse Opportunities
              </Link>
              <Link className="btn-secondary" href="/profile">
                Complete Profile
              </Link>
              <Link className="btn-secondary" href="/applications/new">
                Add External Application
              </Link>
            </div>
          </section>
        )}
        {!loading && !error && applications.length > 0 && (
          <section className="next-actions mt-6">
            <div>
              <p className="eyebrow">Your next steps</p>
              <h2 className="mt-2 text-lg font-semibold">
                {nextDeadline ? "Prepare for your next deadline" : "Keep your search moving."}
              </h2>
            </div>
            {nextDeadline && <div className="primary-action">
              <div><p className="text-sm text-teal-800">Due {formatAppDate(nextDeadline.date)}</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">{nextDeadline.application.roleTitle}</h3>
                <p className="mt-1 text-sm text-slate-600">{nextDeadline.application.organisation}</p></div>
              <Link className="btn" href={"/applications/" + nextDeadline.application.id}>Review application →</Link>
            </div>}
            <div className="grid gap-3 sm:grid-cols-2">
              <Link className="action-tile" href="/calendar">
                <span className="font-semibold">
                  {dashboardStats.upcomingDeadlineCount} deadlines in the next
                  14 days
                </span>
                <span className="text-sm text-slate-600">
                  Review your calendar and plan ahead →
                </span>
              </Link>
              <Link className="action-tile" href="/applications">
                <span className="font-semibold">
                  {
                    applications.filter(
                      (a) =>
                        a.status === "Interested" || a.status === "Preparing",
                    ).length
                  }{" "}
                  roles in preparation
                </span>
                <span className="text-sm text-slate-600">
                  Review requirements and update your tracker →
                </span>
              </Link>
            </div>
          </section>
        )}
        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            title="Total applications"
            value={loading || error ? "—" : dashboardStats.totalApplications}
            helper="All tracked opportunities"
            icon={BriefcaseBusiness}
          />

          <StatCard
            title="Interviews"
            value={loading || error ? "—" : dashboardStats.interviewCount}
            helper="Applications at interview stage"
            icon={CalendarClock}
          />

          <StatCard
            title="Offers"
            value={loading || error ? "—" : dashboardStats.offerCount}
            helper="Current successful outcomes"
            icon={CircleCheckBig}
          />

          <StatCard
            title="Upcoming deadlines"
            value={
              loading || error ? "—" : dashboardStats.upcomingDeadlineCount
            }
            helper="Due within the next 14 days"
            icon={Clock3}
          />
        </div>
      </div>

      <div className="dashboard-task-grid">
        <div className="dashboard-primary">
          {loading ? <LoadingState label="Loading your application progress…" /> : !error && <>
            <ApplicationPipeline applications={applications} />
            <RecentApplications applications={applications} />
          </>}
        </div>
        <aside className="dashboard-support" aria-label="Plan your next step">
          {!loading && !error && <UpcomingTasks applications={applications} />}
          <UpcomingInterviews />
          <section className="dashboard-shortcuts">
            <p className="eyebrow">Keep moving forward</p>
            <Link href="/ai-assistant"><strong>Prepare with AI <span aria-hidden="true">↗</span></strong><span>Review your documents or practise interview questions.</span></Link>
            <Link href="/opportunities"><strong>Explore opportunities <span aria-hidden="true">↗</span></strong><span>Find a role to add to your next steps.</span></Link>
          </section>
        </aside>
      </div>
      <section className="mt-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Explore recent opportunities
          </h2>
          <Link
            className="text-sm font-semibold text-teal-700"
            href="/opportunities"
          >
            Browse all →
          </Link>
        </div>
        <OpportunityBrowser compact />
      </section>
    </DashboardLayout>
  );
}
