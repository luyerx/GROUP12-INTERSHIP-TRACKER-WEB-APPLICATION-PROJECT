"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  LoaderCircle,
  MapPin,
  Pencil,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  UserRound,
  Wrench,
  X,
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
  sourceLink?: string;
  contactPerson?: string;
  jobDescription?: string;
  notes?: string;
  outcome?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ApplicationApiResponse = {
  success: boolean;
  data?: Application;
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

function normaliseStatus(
  value: string | undefined
): ApplicationStatus {
  if (
    value &&
    validStatuses.includes(
      value as ApplicationStatus
    )
  ) {
    return value as ApplicationStatus;
  }

  return "Interested";
}

function normaliseApplication(
  application: Partial<Application>
): Application {
  return {
    id: Number(application.id),
    organisation:
      application.organisation ?? "",
    roleTitle:
      application.roleTitle ?? "",
    location:
      application.location ?? "",
    deadline:
      application.deadline ?? "",
    status: normaliseStatus(
      application.status
    ),
    sourceLink:
      application.sourceLink,
    contactPerson:
      application.contactPerson,
    jobDescription:
      application.jobDescription,
    notes:
      application.notes,
    outcome:
      application.outcome,
    createdAt:
      application.createdAt,
    updatedAt:
      application.updatedAt,
  };
}

function parseDeadline(
  deadline: string
) {
  if (!deadline) {
    return null;
  }

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

function formatDeadline(
  deadline: string
) {
  const date =
    parseDeadline(deadline);

  if (!date) {
    return "Not set";
  }

  return date.toLocaleDateString(
    "en-NZ",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function getTimelineItems(
  status: ApplicationStatus
) {
  const items = [
    {
      title: "Application created",
      subtitle:
        "Application added to tracker",
      active: true,
    },
  ];

  if (
    [
      "Applied",
      "Interview",
      "Offer",
      "Rejected",
    ].includes(status)
  ) {
    items.push({
      title:
        "Application submitted",
      subtitle:
        "Application sent to employer",
      active: true,
    });
  }

  if (
    status === "Interested"
  ) {
    items.push({
      title:
        "Interested in opportunity",
      subtitle: "Current stage",
      active: false,
    });
  }

  if (
    status === "Preparing"
  ) {
    items.push({
      title:
        "Preparing application",
      subtitle: "Current stage",
      active: true,
    });
  }

  if (
    status === "Applied"
  ) {
    items.push({
      title:
        "Waiting for employer response",
      subtitle: "Current stage",
      active: false,
    });
  }

  if (
    status === "Interview"
  ) {
    items.push({
      title: "Interview stage",
      subtitle: "Current stage",
      active: true,
    });
  }

  if (
    status === "Offer"
  ) {
    items.push({
      title: "Offer received",
      subtitle: "Current stage",
      active: true,
    });
  }

  if (
    status === "Rejected"
  ) {
    items.push({
      title:
        "Application rejected",
      subtitle: "Current stage",
      active: true,
    });
  }

  if (
    status === "Withdrawn"
  ) {
    items.push({
      title:
        "Application withdrawn",
      subtitle: "Current stage",
      active: true,
    });
  }

  return items;
}

async function fetchApplication(
  id: string
): Promise<Application> {
  const response = await fetch(
    `/api/applications/${id}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const result: ApplicationApiResponse =
    await response.json();

  if (
    !response.ok ||
    !result.success ||
    !result.data
  ) {
    throw new Error(
      result.message ||
        "Failed to load application."
    );
  }

  return normaliseApplication(
    result.data
  );
}

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const [
    application,
    setApplication,
  ] =
    useState<Application | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    showDeleteModal,
    setShowDeleteModal,
  ] = useState(false);

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  const [status, setStatus] =
    useState<ApplicationStatus>(
      "Interested"
    );

  const [
    isUpdatingStatus,
    setIsUpdatingStatus,
  ] = useState(false);

  const [
    statusError,
    setStatusError,
  ] = useState("");

  const [
    showAiModal,
    setShowAiModal,
  ] = useState(false);

  const [
    isGeneratingSummary,
    setIsGeneratingSummary,
  ] = useState(false);

  const [
    summaryGenerated,
    setSummaryGenerated,
  ] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const initialiseApplication =
      async () => {
        try {
          const loadedApplication =
            await fetchApplication(
              id
            );

          if (!cancelled) {
            setApplication(
              loadedApplication
            );

            setStatus(
              loadedApplication.status
            );
          }
        } catch (error) {
          console.error(
            "Load application error:",
            error
          );

          if (!cancelled) {
            setError(
              error instanceof Error
                ? error.message
                : "Unable to load this application."
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    if (id) {
      void initialiseApplication();
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  const retryLoadApplication =
    async () => {
      setLoading(true);
      setError("");

      try {
        const loadedApplication =
          await fetchApplication(
            id
          );

        setApplication(
          loadedApplication
        );

        setStatus(
          loadedApplication.status
        );
      } catch (error) {
        console.error(
          "Load application error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load this application."
        );
      } finally {
        setLoading(false);
      }
    };

  const timelineItems =
    getTimelineItems(status);

  const handleStatusChange =
    async (
      newStatus: ApplicationStatus
    ) => {
      if (
        !application ||
        isUpdatingStatus
      ) {
        return;
      }

      const previousStatus =
        status;

      setStatus(newStatus);
      setStatusError("");
      setIsUpdatingStatus(true);

      try {
        /*
         * The current backend only supports PUT,
         * and PUT requires organisation + roleTitle.
         * Therefore we send the full current record.
         */
        const response =
          await fetch(
            `/api/applications/${id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify(
                {
                  organisation:
                    application.organisation,
                  roleTitle:
                    application.roleTitle,
                  location:
                    application.location,
                  deadline:
                    application.deadline,
                  status:
                    newStatus,
                }
              ),
            }
          );

        const result: ApplicationApiResponse =
          await response.json();

        if (
          !response.ok ||
          !result.success ||
          !result.data
        ) {
          throw new Error(
            result.message ||
              "Failed to update status."
          );
        }

        const updatedApplication =
          normaliseApplication(
            result.data
          );

        setApplication(
          updatedApplication
        );

        setStatus(
          updatedApplication.status
        );
      } catch (error) {
        console.error(
          "Update application status error:",
          error
        );

        setStatus(
          previousStatus
        );

        setStatusError(
          error instanceof Error
            ? error.message
            : "Unable to update the application status."
        );
      } finally {
        setIsUpdatingStatus(false);
      }
    };

  const handleGenerateSummary =
    async () => {
      setIsGeneratingSummary(
        true
      );

      setSummaryGenerated(false);

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            1600
          )
      );

      setIsGeneratingSummary(
        false
      );

      setSummaryGenerated(true);
    };

  const openAiSummary = () => {
    setShowAiModal(true);

    if (!summaryGenerated) {
      void handleGenerateSummary();
    }
  };

  const handleDelete =
    async () => {
      setIsDeleting(true);

      try {
        const response =
          await fetch(
            `/api/applications/${id}`,
            {
              method:
                "DELETE",
            }
          );

        const result: ApplicationApiResponse =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "Failed to delete application."
          );
        }

        router.push(
          "/applications"
        );

        router.refresh();
      } catch (error) {
        console.error(
          "Delete application error:",
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again."
        );
      } finally {
        setIsDeleting(false);
      }
    };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-6xl">
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <LoaderCircle className="h-6 w-6 animate-spin text-slate-500" />

            <p className="mt-4 text-sm font-medium text-slate-700">
              Loading application...
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Retrieving the selected
              application record.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (
    error ||
    !application
  ) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-6xl">
          <Link
            href="/applications"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to applications
          </Link>

          <div className="mt-6 flex min-h-80 flex-col items-center justify-center rounded-2xl border border-rose-200 bg-white px-6 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertCircle className="h-5 w-5" />
            </div>

            <h2 className="mt-4 text-base font-semibold text-slate-950">
              Unable to load application
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {error ||
                "Application not found."}
            </p>

            <button
              type="button"
              onClick={() =>
                void retryLoadApplication()
              }
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        <Link
          href="/applications"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to applications
        </Link>

        {/* Header */}
        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-semibold text-slate-700 shadow-sm">
              {application.organisation
                .charAt(0)
                .toUpperCase() ||
                "A"}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                  {
                    application.roleTitle
                  }
                </h1>

                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                    statusStyles[
                      status
                    ]
                  }`}
                >
                  {status}
                </span>
              </div>

              <p className="mt-2 text-base font-medium text-slate-600">
                {
                  application.organisation
                }
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />

                  {application.location ||
                    "No location"}
                </span>

                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />

                  Deadline{" "}
                  {formatDeadline(
                    application.deadline
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={
                openAiSummary
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Sparkles className="h-4 w-4" />
              AI summary
            </button>

            <Link
              href={`/applications/${id}/edit`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Link>

            <button
              type="button"
              onClick={() =>
                setShowDeleteModal(
                  true
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3.5 py-2.5 text-sm font-medium text-rose-600 shadow-sm transition hover:bg-rose-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-slate-950">
                    Job description
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Original details
                    saved with this
                    application.
                  </p>
                </div>
              </div>

              <p className="mt-6 text-sm leading-7 text-slate-600">
                {application.jobDescription ||
                  "No job description added."}
              </p>

              {application.sourceLink && (
                <a
                  href={
                    application.sourceLink
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
                >
                  View original job
                  posting

                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">
                Notes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Personal preparation
                and follow-up
                information.
              </p>

              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {application.notes ||
                  "No notes added."}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">
                Application timeline
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                A history of
                important application
                milestones.
              </p>

              <div className="mt-6 space-y-6">
                {timelineItems.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={`${item.title}-${index}`}
                      className="relative flex gap-4"
                    >
                      {index <
                        timelineItems.length -
                          1 && (
                        <div className="absolute left-1.25 top-4 h-full w-px bg-slate-200" />
                      )}

                      <div
                        className={`relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full ${
                          item.active
                            ? "bg-slate-950"
                            : "border-2 border-slate-300 bg-white"
                        }`}
                      />

                      <div className="pb-1">
                        <p
                          className={`text-sm font-medium ${
                            item.active
                              ? "text-slate-900"
                              : "text-slate-700"
                          }`}
                        >
                          {
                            item.title
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {
                            item.subtitle
                          }
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">
                Application details
              </h2>

              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Status
                  </p>

                  <select
                    value={status}
                    disabled={
                      isUpdatingStatus
                    }
                    onChange={(
                      event
                    ) =>
                      void handleStatusChange(
                        event.target
                          .value as ApplicationStatus
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {validStatuses.map(
                      (option) => (
                        <option
                          key={
                            option
                          }
                          value={
                            option
                          }
                        >
                          {
                            option
                          }
                        </option>
                      )
                    )}
                  </select>

                  {isUpdatingStatus && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                      Updating status...
                    </div>
                  )}

                  {statusError && (
                    <p className="mt-2 text-xs leading-5 text-rose-600">
                      {statusError}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Deadline
                  </p>

                  <p className="mt-1.5 text-sm font-medium text-slate-800">
                    {formatDeadline(
                      application.deadline
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Location
                  </p>

                  <p className="mt-1.5 text-sm font-medium text-slate-800">
                    {application.location ||
                      "Not set"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <UserRound className="h-5 w-5 text-slate-500" />

                <h2 className="text-base font-semibold text-slate-950">
                  Contact
                </h2>
              </div>

              <p className="mt-5 text-sm font-medium text-slate-800">
                {application.contactPerson ||
                  "No contact added"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Recruiter / hiring
                contact
              </p>
            </section>

            <section className="rounded-2xl border border-slate-900 bg-slate-950 p-6 text-white shadow-sm">
              <Sparkles className="h-5 w-5 text-slate-300" />

              <h2 className="mt-4 text-base font-semibold">
                Prepare with AI
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Generate a concise
                job summary or
                practice interview
                questions using the
                saved role
                description.
              </p>

              <button
                type="button"
                onClick={
                  openAiSummary
                }
                className="mt-5 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-slate-100"
              >
                Generate AI summary
              </button>
            </section>
          </div>
        </div>
      </div>

      {/* AI Summary modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <button
            type="button"
            aria-label="Close AI summary"
            onClick={() => {
              if (
                !isGeneratingSummary
              ) {
                setShowAiModal(
                  false
                );
              }
            }}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
          />

          <div className="relative z-10 max-h-full w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                  <Sparkles className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    AI job summary
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      application.roleTitle
                    }{" "}
                    ·{" "}
                    {
                      application.organisation
                    }
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={
                  isGeneratingSummary
                }
                onClick={() =>
                  setShowAiModal(
                    false
                  )
                }
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isGeneratingSummary && (
              <div className="flex min-h-100 flex-col items-center justify-center px-6 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <LoaderCircle className="h-6 w-6 animate-spin text-slate-700" />
                </div>

                <h3 className="mt-5 text-base font-semibold text-slate-950">
                  Analysing job
                  description
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  The AI assistant is
                  identifying
                  responsibilities,
                  skills, and useful
                  preparation points.
                </p>
              </div>
            )}

            {!isGeneratingSummary &&
              summaryGenerated && (
                <div className="space-y-6 p-6">
                  <section className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <Target className="h-4 w-4" />
                      </div>

                      <h3 className="text-sm font-semibold text-slate-950">
                        Role overview
                      </h3>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      This software
                      engineering
                      internship focuses
                      on contributing to
                      scalable software
                      products while
                      collaborating with
                      engineering and
                      cross-functional
                      teams. The position
                      values strong
                      technical
                      fundamentals,
                      problem-solving
                      ability, and
                      effective teamwork.
                    </p>
                  </section>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <section className="rounded-2xl border border-slate-200 p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>

                        <h3 className="text-sm font-semibold text-slate-950">
                          Key responsibilities
                        </h3>
                      </div>

                      <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                        <li className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                          Design and
                          develop software
                          features.
                        </li>

                        <li className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                          Test and
                          maintain scalable
                          applications.
                        </li>

                        <li className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                          Collaborate with
                          engineering
                          teams.
                        </li>
                      </ul>
                    </section>

                    <section className="rounded-2xl border border-slate-200 p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <Wrench className="h-4 w-4" />
                        </div>

                        <h3 className="text-sm font-semibold text-slate-950">
                          Required skills
                        </h3>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {[
                          "Programming fundamentals",
                          "Problem solving",
                          "Software development",
                          "Testing",
                          "Team collaboration",
                        ].map(
                          (skill) => (
                            <span
                              key={
                                skill
                              }
                              className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700"
                            >
                              {
                                skill
                              }
                            </span>
                          )
                        )}
                      </div>
                    </section>
                  </div>

                  <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
                        <Lightbulb className="h-4 w-4" />
                      </div>

                      <h3 className="text-sm font-semibold text-slate-950">
                        Suggested
                        preparation
                      </h3>
                    </div>

                    <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                      <li className="flex gap-3">
                        <span className="font-semibold text-slate-400">
                          01
                        </span>
                        Review data
                        structures,
                        algorithms, and
                        core programming
                        concepts.
                      </li>

                      <li className="flex gap-3">
                        <span className="font-semibold text-slate-400">
                          02
                        </span>
                        Prepare examples
                        of projects where
                        you solved a
                        technical
                        problem.
                      </li>

                      <li className="flex gap-3">
                        <span className="font-semibold text-slate-400">
                          03
                        </span>
                        Be ready to
                        explain how you
                        collaborate and
                        communicate within
                        a team.
                      </li>
                    </ul>
                  </section>

                  <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-slate-400">
                      AI-generated
                      content should be
                      reviewed before
                      use.
                    </p>

                    <button
                      type="button"
                      onClick={
                        handleGenerateSummary
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <Sparkles className="h-4 w-4" />
                      Regenerate
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close delete confirmation"
            onClick={() => {
              if (!isDeleting) {
                setShowDeleteModal(
                  false
                );
              }
            }}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
          />

          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Trash2 className="h-5 w-5" />
              </div>

              <button
                type="button"
                disabled={
                  isDeleting
                }
                onClick={() =>
                  setShowDeleteModal(
                    false
                  )
                }
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-950">
              Delete application?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              You are about to
              permanently delete the
              application for{" "}
              <span className="font-medium text-slate-700">
                {
                  application.roleTitle
                }
              </span>{" "}
              at{" "}
              <span className="font-medium text-slate-700">
                {
                  application.organisation
                }
              </span>
              .
            </p>

            <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/60 px-4 py-3">
              <p className="text-xs leading-5 text-rose-700">
                This action cannot be
                undone once the
                application is deleted.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={
                  isDeleting
                }
                onClick={() =>
                  setShowDeleteModal(
                    false
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  isDeleting
                }
                onClick={() =>
                  void handleDelete()
                }
                className="inline-flex min-w-35 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete application
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}