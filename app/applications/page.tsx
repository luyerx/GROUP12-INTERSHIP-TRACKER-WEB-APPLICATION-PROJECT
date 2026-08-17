"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

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

const statusStyles: Record<ApplicationStatus, string> = {
  Interested:
    "bg-slate-100 text-slate-700 ring-slate-500/20",
  Preparing:
    "bg-violet-50 text-violet-700 ring-violet-600/20",
  Applied:
    "bg-blue-50 text-blue-700 ring-blue-600/20",
  Interview:
    "bg-amber-50 text-amber-700 ring-amber-600/20",
  Offer:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Rejected:
    "bg-rose-50 text-rose-700 ring-rose-600/20",
  Withdrawn:
    "bg-slate-100 text-slate-500 ring-slate-500/20",
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

function normaliseApplication(
  application: Partial<Application>
): Application {
  const status = validStatuses.includes(
    application.status as ApplicationStatus
  )
    ? (application.status as ApplicationStatus)
    : "Interested";

  return {
    id: Number(application.id),
    organisation: application.organisation ?? "",
    roleTitle: application.roleTitle ?? "",
    location: application.location ?? "",
    deadline: application.deadline ?? "",
    status,
  };
}

function parseDeadline(deadline: string) {
  if (!deadline) {
    return null;
  }

  /*
   * Supports:
   * YYYY-MM-DD
   * DD/MM/YYYY
   * Other browser-readable date strings
   */

  const isoMatch = deadline.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (isoMatch) {
    const [, year, month, day] = isoMatch;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );
  }

  const nzMatch = deadline.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );

  if (nzMatch) {
    const [, day, month, year] = nzMatch;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );
  }

  const fallbackDate = new Date(deadline);

  if (Number.isNaN(fallbackDate.getTime())) {
    return null;
  }

  return fallbackDate;
}

function formatDeadline(deadline: string) {
  const date = parseDeadline(deadline);

  if (!date) {
    return "Not set";
  }

  return date.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ApplicationsPage() {
  const [applications, setApplications] =
    useState<Application[]>([]);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [locationFilter, setLocationFilter] =
    useState("All");

  const [sortDirection, setSortDirection] =
    useState<"asc" | "desc">("asc");

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const fetchApplications =
    async (): Promise<Application[]> => {
      const response = await fetch(
        "/api/applications",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result: ApplicationsApiResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Failed to load applications."
        );
      }

      return Array.isArray(result.data)
        ? result.data.map(
            normaliseApplication
          )
        : [];
    };

  useEffect(() => {
    let cancelled = false;

    const initialiseApplications =
      async () => {
        try {
          const loadedApplications =
            await fetchApplications();

          if (!cancelled) {
            setApplications(
              loadedApplications
            );
          }
        } catch (error) {
          console.error(
            "Load applications error:",
            error
          );

          if (!cancelled) {
            setError(
              error instanceof Error
                ? error.message
                : "Unable to load applications."
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

  const retryLoadApplications =
    async () => {
      setIsLoading(true);
      setError("");

      try {
        const loadedApplications =
          await fetchApplications();

        setApplications(
          loadedApplications
        );
      } catch (error) {
        console.error(
          "Load applications error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load applications."
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
          .map((application) =>
            application.location.trim()
          )
          .filter(Boolean)
      )
    ).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [applications]);

  const filteredApplications =
    useMemo(() => {
      const searchText =
        search.trim().toLowerCase();

      const filtered =
        applications.filter(
          (application) => {
            const matchesSearch =
              !searchText ||
              application.organisation
                .toLowerCase()
                .includes(
                  searchText
                ) ||
              application.roleTitle
                .toLowerCase()
                .includes(
                  searchText
                );

            const matchesStatus =
              statusFilter ===
                "All" ||
              application.status ===
                statusFilter;

            const matchesLocation =
              locationFilter ===
                "All" ||
              application.location ===
                locationFilter;

            return (
              matchesSearch &&
              matchesStatus &&
              matchesLocation
            );
          }
        );

      return [...filtered].sort(
        (a, b) => {
          const firstDate =
            parseDeadline(
              a.deadline
            );

          const secondDate =
            parseDeadline(
              b.deadline
            );

          /*
           * Applications without a
           * deadline stay at the bottom.
           */
          if (
            !firstDate &&
            !secondDate
          ) {
            return 0;
          }

          if (!firstDate) {
            return 1;
          }

          if (!secondDate) {
            return -1;
          }

          return sortDirection ===
            "asc"
            ? firstDate.getTime() -
                secondDate.getTime()
            : secondDate.getTime() -
                firstDate.getTime();
        }
      );
    }, [
      applications,
      search,
      statusFilter,
      locationFilter,
      sortDirection,
    ]);

  const filtersActive =
    search.trim() !== "" ||
    statusFilter !== "All" ||
    locationFilter !== "All";

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
              Application management
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Applications
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Organise every internship
              opportunity, monitor progress,
              and keep important deadlines
              in one place.
            </p>
          </div>

          <Link
            href="/applications/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add application
          </Link>
        </div>

        {/* Filters */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(280px,1fr)_180px_180px_180px]">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                disabled={isLoading}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search organisation or role..."
                aria-label="Search applications"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Status */}
            <div className="relative">
              <select
                value={statusFilter}
                disabled={isLoading}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                aria-label="Filter applications by status"
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="All">
                  All statuses
                </option>

                {validStatuses.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  )
                )}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Location */}
            <div className="relative">
              <select
                value={locationFilter}
                disabled={isLoading}
                onChange={(event) =>
                  setLocationFilter(
                    event.target.value
                  )
                }
                aria-label="Filter applications by location"
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="All">
                  All locations
                </option>

                {locations.map(
                  (location) => (
                    <option
                      key={location}
                      value={location}
                    >
                      {location}
                    </option>
                  )
                )}
              </select>

              <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Sort */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() =>
                setSortDirection(
                  (current) =>
                    current === "asc"
                      ? "desc"
                      : "asc"
                )
              }
              className="flex h-11 items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>
                Deadline{" "}
                {sortDirection ===
                "asc"
                  ? "earliest"
                  : "latest"}
              </span>

              <ArrowUpDown className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </section>

        {/* Loading */}
        {isLoading && (
          <section className="mt-6 flex min-h-96 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <LoaderCircle className="h-6 w-6 animate-spin text-slate-500" />

            <p className="mt-3 text-sm font-medium text-slate-700">
              Loading applications...
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Retrieving your application
              records.
            </p>
          </section>
        )}

        {/* API Error */}
        {!isLoading && error && (
          <section className="mt-6 flex min-h-80 flex-col items-center justify-center rounded-2xl border border-rose-200 bg-white px-6 text-center shadow-sm">
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
              onClick={() =>
                void retryLoadApplications()
              }
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
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
                  {
                    filteredApplications.length
                  }{" "}
                  {filteredApplications.length ===
                  1
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
            <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {filteredApplications.length >
              0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-225 text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-medium uppercase tracking-wide text-slate-400">
                        <th className="px-6 py-4">
                          Organisation
                        </th>

                        <th className="px-6 py-4">
                          Role
                        </th>

                        <th className="px-6 py-4">
                          Location
                        </th>

                        <th className="px-6 py-4">
                          Deadline
                        </th>

                        <th className="px-6 py-4">
                          Status
                        </th>

                        <th className="w-20 px-6 py-4" />
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredApplications.map(
                        (
                          application
                        ) => (
                          <tr
                            key={
                              application.id
                            }
                            className="group transition-colors hover:bg-slate-50/80"
                          >
                            {/* Organisation */}
                            <td className="px-6 py-4">
                              <Link
                                href={`/applications/${application.id}`}
                                className="flex items-center gap-3"
                              >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                                  {application.organisation
                                    .charAt(
                                      0
                                    )
                                    .toUpperCase() ||
                                    "?"}
                                </div>

                                <div>
                                  <p className="text-sm font-semibold text-slate-900 transition group-hover:text-slate-950">
                                    {
                                      application.organisation
                                    }
                                  </p>

                                  <p className="mt-0.5 text-xs text-slate-400">
                                    Application #
                                    {
                                      application.id
                                    }
                                  </p>
                                </div>
                              </Link>
                            </td>

                            {/* Role */}
                            <td className="px-6 py-4">
                              <Link
                                href={`/applications/${application.id}`}
                                className="text-sm font-medium text-slate-700 transition hover:text-slate-950"
                              >
                                {
                                  application.roleTitle
                                }
                              </Link>
                            </td>

                            {/* Location */}
                            <td className="px-6 py-4">
                              {application.location ? (
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                  <MapPin className="h-4 w-4 text-slate-400" />

                                  {
                                    application.location
                                  }
                                </div>
                              ) : (
                                <span className="text-sm text-slate-400">
                                  Not set
                                </span>
                              )}
                            </td>

                            {/* Deadline */}
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-600">
                                {formatDeadline(
                                  application.deadline
                                )}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                                  statusStyles[
                                    application
                                      .status
                                  ]
                                }`}
                              >
                                {
                                  application.status
                                }
                              </span>
                            </td>

                            {/* Edit */}
                            <td className="px-6 py-4">
                              <Link
                                href={`/applications/${application.id}/edit`}
                                aria-label={`Edit ${application.organisation} application`}
                                title="Edit application"
                                className="inline-flex rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : applications.length ===
                0 ? (
                /* No applications at all */
                <div className="flex min-h-90 flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                    <BriefcaseBusiness className="h-6 w-6" />
                  </div>

                  <h2 className="mt-5 text-base font-semibold text-slate-950">
                    No applications yet
                  </h2>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    Add your first
                    internship opportunity
                    to start tracking your
                    application journey.
                  </p>

                  <Link
                    href="/applications/new"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    <Plus className="h-4 w-4" />
                    Add application
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
                    No applications match
                    your current search or
                    filters.
                  </p>

                  <button
                    type="button"
                    onClick={
                      clearFilters
                    }
                    className="mt-5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </section>

            {/* Pagination placeholder */}
            {filteredApplications.length >
              0 && (
              <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-slate-500">
                  Showing{" "}
                  <span className="font-medium text-slate-700">
                    1–
                    {
                      filteredApplications.length
                    }
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-slate-700">
                    {
                      filteredApplications.length
                    }
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-400 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white"
                  >
                    1
                  </button>

                  <button
                    type="button"
                    disabled
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-400 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}