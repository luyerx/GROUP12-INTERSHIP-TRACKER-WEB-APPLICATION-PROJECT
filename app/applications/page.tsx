"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  ArrowUpDown,
  BriefcaseBusiness,
  ChevronDown,
  MapPin,
  MoreHorizontal,
  Plus,
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

const statusStyles: Record<ApplicationStatus, string> = {
  Interested: "bg-slate-100 text-slate-700 ring-slate-500/20",
  Preparing: "bg-violet-50 text-violet-700 ring-violet-600/20",
  Applied: "bg-blue-50 text-blue-700 ring-blue-600/20",
  Interview: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Offer: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
  Withdrawn: "bg-slate-100 text-slate-500 ring-slate-500/20",
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const response = await fetch("/api/applications");
        const result = await response.json();

        if (response.ok) {
          setApplications(result.data);
        } else {
          console.error("Failed to load applications:", result.message);
        }
      } catch (error) {
        console.error("Load applications error:", error);
      }
    };

    loadApplications();
  }, []);

  const filteredApplications = useMemo(() => {
    const filtered = applications.filter((application) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        application.organisation.toLowerCase().includes(searchText) ||
        application.roleTitle.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All" || application.status === statusFilter;

      const matchesLocation =
        locationFilter === "All" || application.location === locationFilter;

      return matchesSearch && matchesStatus && matchesLocation;
    });

    return [...filtered].sort((a, b) => {
      const first = new Date(a.deadline).getTime();
      const second = new Date(b.deadline).getTime();

      return sortDirection === "asc"
        ? first - second
        : second - first;
    });
  }, [applications, search, statusFilter, locationFilter, sortDirection]);

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
              Organise every internship opportunity, monitor progress, and keep
              important deadlines in one place.
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
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search organisation or role..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </div>

            {/* Status */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              >
                <option value="All">All statuses</option>
                <option value="Interested">Interested</option>
                <option value="Preparing">Preparing</option>
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
                <option value="Withdrawn">Withdrawn</option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Location */}
            <div className="relative">
              <select
                value={locationFilter}
                onChange={(event) => setLocationFilter(event.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              >
                <option value="All">All locations</option>
                <option value="Auckland">Auckland</option>
                <option value="Wellington">Wellington</option>
                <option value="Christchurch">Christchurch</option>
                <option value="Remote">Remote</option>
              </select>

              <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Sort */}
            <button
              type="button"
              onClick={() =>
                setSortDirection((current) =>
                  current === "asc" ? "desc" : "asc"
                )
              }
              className="flex h-11 items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <span>
                Deadline {sortDirection === "asc" ? "earliest" : "latest"}
              </span>

              <ArrowUpDown className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </section>

        {/* Results summary */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-950">
              {filteredApplications.length} applications
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Showing applications matching your current filters.
            </p>
          </div>
        </div>

        {/* Table */}
        <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {filteredApplications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-225 text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-medium uppercase tracking-wide text-slate-400">
                    <th className="px-6 py-4">Organisation</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Deadline</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="w-16 px-6 py-4" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredApplications.map((application) => (
                    <tr
                    key={application.id}
                    className="group cursor-pointer transition-colors hover:bg-slate-50/80"
                    >
                    <td className="px-6 py-4">
                    <Link
                        href={`/applications/${application.id}`}
                        className="flex items-center gap-3"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                        {application.organisation.charAt(0)}
                        </div>

                        <div>
                        <p className="text-sm font-semibold text-slate-900 transition group-hover:text-slate-950">
                            {application.organisation}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                            Application #{application.id}
                        </p>
                        </div>
                    </Link>
                    </td>

                        <td className="px-6 py-4">
                        <Link
                            href={`/applications/${application.id}`}
                            className="text-sm font-medium text-slate-700 transition hover:text-slate-950"
                        >
                            {application.roleTitle}
                        </Link>
                        </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          {application.location}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {new Date(application.deadline).toLocaleDateString(
                            "en-NZ",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>
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
                        <button
                          type="button"
                          aria-label={`Open actions for ${application.organisation}`}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-90 flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <BriefcaseBusiness className="h-6 w-6" />
              </div>

              <h2 className="mt-5 text-base font-semibold text-slate-950">
                No applications found
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Try adjusting your filters or create a new internship
                application.
              </p>

              <Link
                href="/applications/new"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Add application
              </Link>
            </div>
          )}
        </section>

        {/* Pagination */}
        {filteredApplications.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-slate-500">
              Showing{" "}
              <span className="font-medium text-slate-700">
                1–{filteredApplications.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-700">
                {filteredApplications.length}
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
      </div>
    </DashboardLayout>
  );
}