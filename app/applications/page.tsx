"use client";

import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import Deadline from "@/components/ui/Deadline";
import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  ArrowUpDown,
  BriefcaseBusiness,
  ChevronDown,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { parseAppDate } from "@/lib/date";

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

const validStatuses: ApplicationStatus[] = [
  "Interested",
  "Preparing",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
];

function normaliseApplication(application: Partial<Application>): Application {
  const status = validStatuses.includes(application.status as ApplicationStatus)
    ? (application.status as ApplicationStatus)
    : "Interested";

  return {
    id: String(application.id ?? ""),

    organisation: application.organisation ?? "",

    roleTitle: application.roleTitle ?? "",

    location: application.location ?? "",

    deadline: application.deadline ?? "",

    status,
  };
}

/*
 * Use the shared parser first.
 * Keep the previous browser-readable
 * fallback behaviour for compatibility.
 */
function parseApplicationsDeadline(deadline: string): Date | null {
  const parsedDate = parseAppDate(deadline);

  if (parsedDate) {
    return parsedDate;
  }

  if (!deadline) {
    return null;
  }

  const fallbackDate = new Date(deadline);

  if (Number.isNaN(fallbackDate.getTime())) {
    return null;
  }

  return fallbackDate;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [locationFilter, setLocationFilter] = useState("All");

  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  const fetchApplications = async (): Promise<Application[]> => {
    const response = await fetch("/api/applications", {
      method: "GET",
      cache: "no-store",
    });

    const result: ApplicationsApiResponse = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to load applications.");
    }

    return Array.isArray(result.data)
      ? result.data.map(normaliseApplication)
      : [];
  };

  useEffect(() => {
    let cancelled = false;

    const initialiseApplications = async () => {
      try {
        const loadedApplications = await fetchApplications();

        if (!cancelled) {
          setApplications(loadedApplications);
        }
      } catch (error) {
        console.error("Load applications error:", error);

        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load applications.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void initialiseApplications();

    return () => {
      cancelled = true;
    };
  }, []);

  const retryLoadApplications = async () => {
    setIsLoading(true);
    setError("");

    try {
      const loadedApplications = await fetchApplications();

      setApplications(loadedApplications);
    } catch (error) {
      console.error("Load applications error:", error);

      setError(
        error instanceof Error ? error.message : "Unable to load applications.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  /*
   * Locations are generated from real
   * application data rather than being
   * hard-coded.
   */
  const locations = useMemo(() => {
    return Array.from(
      new Set(
        applications
          .map((application) => application.location.trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    const filtered = applications.filter((application) => {
      const matchesSearch =
        !searchText ||
        application.organisation.toLowerCase().includes(searchText) ||
        application.roleTitle.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All" || application.status === statusFilter;

      const matchesLocation =
        locationFilter === "All" || application.location === locationFilter;

      return matchesSearch && matchesStatus && matchesLocation;
    });

    return [...filtered].sort((a, b) => {
      const firstDate = parseApplicationsDeadline(a.deadline);

      const secondDate = parseApplicationsDeadline(b.deadline);

      /*
       * Applications without a
       * deadline stay at the bottom.
       */
      if (!firstDate && !secondDate) {
        return 0;
      }

      if (!firstDate) {
        return 1;
      }

      if (!secondDate) {
        return -1;
      }

      return sortDirection === "asc"
        ? firstDate.getTime() - secondDate.getTime()
        : secondDate.getTime() - firstDate.getTime();
    });
  }, [applications, search, statusFilter, locationFilter, sortDirection]);

  const filtersActive =
    search.trim() !== "" || statusFilter !== "All" || locationFilter !== "All";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setLocationFilter("All");
  };

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Your personal tracker
            </p>

            <h1 className="mt-2 page-title">My Applications</h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Organise every internship opportunity, monitor progress, and keep
              important deadlines in one place.
            </p>
          </div>

          <Link href="/applications/new" className="btn ">
            <Plus className="h-4 w-4" />
            Add External Application
          </Link>
        </div>

        {!isLoading && !error && applications.length > 0 && <section className="mt-6 border-l-4 border-teal-700 pl-4">
          <h2 className="text-lg font-semibold">Your application pipeline</h2>
          <p className="mt-1 text-sm text-slate-600">{applications.filter(a => a.status === "Interested" || a.status === "Preparing").length} in preparation · {applications.filter(a => a.status === "Applied" || a.status === "Interview").length} awaiting progress · {applications.filter(a => a.status === "Offer").length} offers</p>
          <p className="mt-2 text-xs text-slate-500">Choose a stage below to filter your tracker. Tracking a role does not submit an application.</p>
        </section>}
        {/* Filters */}
        <section className="mt-8 card p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_150px_150px_180px]">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                type="search"
                value={search}
                disabled={isLoading}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search organisation or role..."
                aria-label="Search applications"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Status */}
            <div className="relative">
              <select
                value={statusFilter}
                disabled={isLoading}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter applications by status"
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="All">All statuses</option>

                {validStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>

            {/* Location */}
            <div className="relative">
              <select
                value={locationFilter}
                disabled={isLoading}
                onChange={(event) => setLocationFilter(event.target.value)}
                aria-label="Filter applications by location"
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="All">All locations</option>

                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>

              <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>

            {/* Sort */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() =>
                setSortDirection((current) =>
                  current === "asc" ? "desc" : "asc",
                )
              }
              className="flex h-11 items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>
                Deadline {sortDirection === "asc" ? "earliest" : "latest"}
              </span>

              <ArrowUpDown className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </section>

        {!isLoading && !error && applications.length > 0 && (
          <section
            aria-label="Filter applications by stage"
            className="pipeline-tabs mt-6"
          >
            {["All", ...validStatuses].map((stage) => (
              <button
                key={stage}
                type="button"
                className="pipeline-tab"
                aria-pressed={statusFilter === stage}
                onClick={() => setStatusFilter(stage)}
              >
                <span>{stage}</span>
                <strong>
                  {stage === "All"
                    ? applications.length
                    : applications.filter((a) => a.status === stage).length}
                </strong>
              </button>
            ))}
          </section>
        )}
        {/* Loading */}
        {isLoading && (
          <section
            role="status"
            className="mt-6 flex min-h-96 flex-col items-center justify-center card"
          >
            <LoaderCircle className="h-6 w-6 animate-spin text-slate-500" />

            <p className="mt-3 text-sm font-medium text-slate-700">
              Loading applications...
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Retrieving your application records.
            </p>
          </section>
        )}

        {/* API Error */}
        {!isLoading && error && (
          <section
            role="alert"
            className="mt-6 flex min-h-80 flex-col items-center justify-center rounded-2xl border border-rose-200 bg-white px-6 text-center shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertCircle className="h-5 w-5" />
            </div>

            <h2 className="mt-4 text-base font-semibold text-slate-950">
              Unable to load applications
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void retryLoadApplications()}
              className="btn mt-5"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </section>
        )}

        {!isLoading && !error && (
          <>
            {/* Results summary */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {filteredApplications.length}{" "}
                  {filteredApplications.length === 1
                    ? "application"
                    : "applications"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {filtersActive
                    ? `Showing ${filteredApplications.length} of ${applications.length} applications matching your filters.`
                    : `${applications.length} total applications in your tracker.`}
                </p>
              </div>

              {filtersActive && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-fit text-sm font-medium text-slate-500 transition hover:text-slate-950"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Table / Empty State */}
            <section className="mt-4 overflow-hidden card">
              {filteredApplications.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="tracker-table w-full text-left">
                    <caption className="sr-only">
                      Your applications and current progress
                    </caption>
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <th className="px-6 py-4">Organisation</th>

                        <th className="px-6 py-4">Role</th>

                        <th className="px-6 py-4">Location</th>

                        <th className="px-6 py-4">Deadline</th>

                        <th className="px-6 py-4">Status</th>

                        <th className="w-20 px-6 py-4">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredApplications.map((application) => (
                        <tr
                          key={application.id}
                          className="group transition-colors hover:bg-slate-50/80"
                        >
                          {/* Organisation */}
                          <td data-label="Company" className="px-6 py-4">
                            <Link
                              href={`/applications/${application.id}`}
                              className="flex items-center gap-3"
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                                {application.organisation
                                  .charAt(0)
                                  .toUpperCase() || "?"}
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-slate-900 transition group-hover:text-slate-950">
                                  {application.organisation}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-500">
                                  View application →
                                </p>
                              </div>
                            </Link>
                          </td>

                          {/* Role */}
                          <td data-label="Role" className="px-6 py-4">
                            <Link
                              href={`/applications/${application.id}`}
                              className="text-sm font-medium text-slate-700 transition hover:text-slate-950"
                            >
                              {application.roleTitle}
                            </Link>
                          </td>

                          {/* Location */}
                          <td data-label="Location" className="px-6 py-4">
                            {application.location ? (
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <MapPin className="h-4 w-4 text-slate-500" />

                                {application.location}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-500">
                                Not set
                              </span>
                            )}
                          </td>

                          {/* Deadline */}
                          <td data-label="Deadline" className="px-6 py-4">
                            <Deadline value={application.deadline} />
                          </td>

                          {/* Status */}
                          <td data-label="Status" className="px-6 py-4">
                            <StatusBadge value={application.status} />
                          </td>

                          {/* Edit */}
                          <td data-label="Actions" className="px-6 py-4">
                            <Link
                              href={`/applications/${application.id}/edit`}
                              aria-label={`Edit ${application.organisation} application`}
                              title="Edit application"
                              className="icon-button"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : applications.length === 0 ? (
                /* No applications at all */
                <div className="flex min-h-90 flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                    <BriefcaseBusiness className="h-6 w-6" />
                  </div>

                  <h2 className="mt-5 text-base font-semibold text-slate-950">
                    No applications yet
                  </h2>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    Browse published opportunities and track a role to start
                    your pipeline. Use Add External Application for roles found
                    elsewhere.
                  </p>

                  <Link className="btn mt-5" href="/opportunities">
                    Browse Opportunities
                  </Link>
                  <Link href="/applications/new" className="btn mt-5">
                    <Plus className="h-4 w-4" />
                    Add External Application
                  </Link>
                </div>
              ) : (
                /* Filters returned nothing */
                <div className="flex min-h-90 flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                    <Search className="h-6 w-6" />
                  </div>

                  <h2 className="mt-5 text-base font-semibold text-slate-950">
                    No matching applications
                  </h2>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    No applications match your current search or filters.
                  </p>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="btn mt-5"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
