"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarClock,
  CircleCheckBig,
  Clock3,
  RefreshCw,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import ApplicationPipeline from "@/components/dashboard/ApplicationPipeline";
import UpcomingTasks from "@/components/dashboard/UpcomingTasks";
import RecentApplications from "@/components/dashboard/RecentApplications";

type ApplicationStatus =
  | "Interested"
  | "Preparing"
  | "Applied"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Withdrawn";

type Application = {
  id: number;
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

function parseDeadline(
  deadline: string
) {
  if (!deadline) {
    return null;
  }

  /*
   * YYYY-MM-DD
   */
  const isoMatch = deadline.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (isoMatch) {
    const [, year, month, day] =
      isoMatch;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );
  }

  /*
   * DD/MM/YYYY
   */
  const nzMatch = deadline.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );

  if (nzMatch) {
    const [, day, month, year] =
      nzMatch;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );
  }

  const fallback =
    new Date(deadline);

  if (
    Number.isNaN(
      fallback.getTime()
    )
  ) {
    return null;
  }

  return fallback;
}

async function fetchApplications(): Promise<
  Application[]
> {
  const response = await fetch(
    "/api/applications",
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const result: ApplicationsApiResponse =
    await response.json();

  if (
    !response.ok ||
    !result.success
  ) {
    throw new Error(
      result.message ||
        "Failed to load applications."
    );
  }

  return Array.isArray(
    result.data
  )
    ? result.data
    : [];
}

export default function DashboardPage() {
  const [
    applications,
    setApplications,
  ] = useState<Application[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    const initialiseDashboard =
      async () => {
        try {
          const data =
            await fetchApplications();

          if (!cancelled) {
            setApplications(data);
          }
        } catch (error) {
          console.error(
            "Failed to load dashboard applications:",
            error
          );

          if (!cancelled) {
            setError(
              error instanceof Error
                ? error.message
                : "Unable to load dashboard data."
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

  const retryDashboard =
    async () => {
      setLoading(true);
      setError("");

      try {
        const data =
          await fetchApplications();

        setApplications(data);
      } catch (error) {
        console.error(
          "Failed to load dashboard applications:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

  const dashboardStats =
    useMemo(() => {
      const totalApplications =
        applications.length;

      const interviewCount =
        applications.filter(
          (application) =>
            application.status ===
            "Interview"
        ).length;

      const offerCount =
        applications.filter(
          (application) =>
            application.status ===
            "Offer"
        ).length;

      const today = new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      const fourteenDaysFromNow =
        new Date(today);

      fourteenDaysFromNow.setDate(
        today.getDate() + 14
      );

      const upcomingDeadlineCount =
        applications.filter(
          (application) => {
            const deadline =
              parseDeadline(
                application.deadline
              );

            if (!deadline) {
              return false;
            }

            deadline.setHours(
              0,
              0,
              0,
              0
            );

            return (
              deadline >= today &&
              deadline <=
                fourteenDaysFromNow
            );
          }
        ).length;

      return {
        totalApplications,
        interviewCount,
        offerCount,
        upcomingDeadlineCount,
      };
    }, [applications]);

  const currentDateLabel =
    new Date().toLocaleDateString(
      "en-NZ",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
      }
    );

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <p className="text-sm font-medium text-slate-500">
          {currentDateLabel}
        </p>

        <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Welcome back, Yanzhen
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Track applications,
              interviews, deadlines,
              and your overall
              internship progress.
            </p>
          </div>

          <Link
            href="/applications/new"
            className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            Add application
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-rose-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertCircle className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Unable to load dashboard
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void retryDashboard()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total applications"
            value={
              loading
                ? "—"
                : dashboardStats.totalApplications
            }
            helper="All tracked opportunities"
            icon={
              BriefcaseBusiness
            }
          />

          <StatCard
            title="Interviews"
            value={
              loading
                ? "—"
                : dashboardStats.interviewCount
            }
            helper="Applications at interview stage"
            icon={
              CalendarClock
            }
          />

          <StatCard
            title="Offers"
            value={
              loading
                ? "—"
                : dashboardStats.offerCount
            }
            helper="Current successful outcomes"
            icon={
              CircleCheckBig
            }
          />

          <StatCard
            title="Upcoming deadlines"
            value={
              loading
                ? "—"
                : dashboardStats.upcomingDeadlineCount
            }
            helper="Due within the next 14 days"
            icon={
              Clock3
            }
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <ApplicationPipeline
          applications={
            applications
          }
        />

        <UpcomingTasks
          applications={
            applications
          }
        />
      </div>

      <div className="mt-6">
        <RecentApplications
          applications={
            applications
          }
        />
      </div>
    </DashboardLayout>
  );
}