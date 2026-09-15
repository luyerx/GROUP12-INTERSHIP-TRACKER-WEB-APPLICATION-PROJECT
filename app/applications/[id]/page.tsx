"use client";
import ApplicationHeader from "@/components/applications/ApplicationHeader";
import DeleteApplicationModal from "@/components/applications/DeleteApplicationModal";

import ApplicationProgress from "@/components/applications/ApplicationProgress";

import ApplicationContact from "@/components/applications/ApplicationContact";

import ApplicationTimeline from "@/components/applications/ApplicationTimeline";

import ApplicationNotes from "@/components/applications/ApplicationNotes";

import ApplicationOverview from "@/components/applications/ApplicationOverview";

import { Application, ApplicationStatus } from "@/components/applications/detailTypes";


import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  AlertCircle,
  ArrowLeft,
  LoaderCircle,
  RefreshCw,
  Sparkles
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { parseAppDate } from "@/lib/date";





type ApplicationApiResponse = {
  success: boolean;
  data?: Application;
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

function normaliseStatus(value: string | undefined): ApplicationStatus {
  if (value && validStatuses.includes(value as ApplicationStatus)) {
    return value as ApplicationStatus;
  }

  return "Interested";
}

function normaliseApplication(application: Partial<Application>): Application {
  return {
    id: String(application.id ?? ""),
    opportunityId: application.opportunityId,
    organisation: application.organisation ?? "",
    roleTitle: application.roleTitle ?? "",
    location: application.location ?? "",
    deadline: application.deadline ?? "",
    status: normaliseStatus(application.status),
    sourceLink: application.sourceLink,
    contactPerson: application.contactPerson,
    jobDescription: application.jobDescription,
    notes: application.notes,
    outcome: application.outcome,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  };
}

function parseDetailDeadline(deadline: string): Date | null {
  const parsedDate = parseAppDate(deadline);

  if (parsedDate) {
    return parsedDate;
  }

  if (!deadline) {
    return null;
  }

  /*
   * Keep the previous fallback behaviour
   * for other browser-readable date strings.
   */
  const fallback = new Date(deadline);

  if (Number.isNaN(fallback.getTime())) {
    return null;
  }

  return fallback;
}

function formatDeadline(deadline: string): string {
  const date = parseDetailDeadline(deadline);

  if (!date) {
    return "Not set";
  }

  return date.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTimelineItems(status: ApplicationStatus) {
  const items = [
    {
      title: "Application created",
      subtitle: "Application added to tracker",
      active: true,
    },
  ];

  if (["Applied", "Interview", "Offer", "Rejected"].includes(status)) {
    items.push({
      title: "Application submitted",
      subtitle: "Application sent to employer",
      active: true,
    });
  }

  if (status === "Interested") {
    items.push({
      title: "Interested in opportunity",
      subtitle: "Current stage",
      active: false,
    });
  }

  if (status === "Preparing") {
    items.push({
      title: "Preparing application",
      subtitle: "Current stage",
      active: true,
    });
  }

  if (status === "Applied") {
    items.push({
      title: "Waiting for employer response",
      subtitle: "Current stage",
      active: false,
    });
  }

  if (status === "Interview") {
    items.push({
      title: "Interview stage",
      subtitle: "Current stage",
      active: true,
    });
  }

  if (status === "Offer") {
    items.push({
      title: "Offer received",
      subtitle: "Current stage",
      active: true,
    });
  }

  if (status === "Rejected") {
    items.push({
      title: "Application rejected",
      subtitle: "Current stage",
      active: true,
    });
  }

  if (status === "Withdrawn") {
    items.push({
      title: "Application withdrawn",
      subtitle: "Current stage",
      active: true,
    });
  }

  return items;
}

async function fetchApplication(id: string): Promise<Application> {
  const response = await fetch(`/api/applications/${id}`, {
    method: "GET",
    cache: "no-store",
  });

  const result: ApplicationApiResponse = await response.json();

  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.message || "Failed to load application.");
  }

  return normaliseApplication(result.data);
}

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const [status, setStatus] = useState<ApplicationStatus>("Interested");

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const initialiseApplication = async () => {
      try {
        const loadedApplication = await fetchApplication(id);

        if (!cancelled) {
          setApplication(loadedApplication);

          setStatus(loadedApplication.status);
        }
      } catch (error) {
        console.error("Load application error:", error);

        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load this application.",
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

  const retryLoadApplication = async () => {
    setLoading(true);
    setError("");

    try {
      const loadedApplication = await fetchApplication(id);

      setApplication(loadedApplication);

      setStatus(loadedApplication.status);
    } catch (error) {
      console.error("Load application error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load this application.",
      );
    } finally {
      setLoading(false);
    }
  };

  const timelineItems = getTimelineItems(status);

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!application || isUpdatingStatus) {
      return;
    }

    const previousStatus = status;

    setStatus(newStatus);
    setStatusError("");
    setIsUpdatingStatus(true);

    try {
      const response = await fetch(`/api/applications/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result: ApplicationApiResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "Failed to update status.");
      }

      const updatedApplication = normaliseApplication(result.data);

      setApplication(updatedApplication);

      setStatus(updatedApplication.status);
    } catch (error) {
      console.error("Update application status error:", error);

      setStatus(previousStatus);

      setStatusError(
        error instanceof Error
          ? error.message
          : "Unable to update the application status.",
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: "DELETE",
      });

      const result: ApplicationApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete application.");
      }

      router.push("/applications");

      router.refresh();
    } catch (error) {
      console.error("Delete application error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-6xl">
          <div className="flex min-h-72 flex-col items-center justify-center card p-6 text-center">
            <LoaderCircle className="h-6 w-6 animate-spin text-slate-500" />

            <p className="mt-4 text-sm font-medium text-slate-700">
              Loading application...
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Retrieving the selected application record.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !application) {
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
              {error || "Application not found."}
            </p>

            <button
              type="button"
              onClick={() => void retryLoadApplication()}
              className="btn mt-5"
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
      <div className="mb-6 rounded-xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-900">
        {application.opportunityId ? (
          <>
            Tracked from a published opportunity. This is your personal
            application record; changing its status does not notify the
            employer.{" "}
            <Link
              className="font-semibold underline"
              href={"/opportunities/" + application.opportunityId}
            >
              View original listing
            </Link>
          </>
        ) : (
          <>
            External application: a role added manually from outside this
            platform.
          </>
        )}
      </div>
      <div className="mx-auto max-w-6xl">
        <Link
          href="/applications"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to applications
        </Link>

        {/* Header */}
        <ApplicationHeader application={application} status={status} id={id} setShowDeleteModal={setShowDeleteModal} />

        {/* Main content */}
        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            <ApplicationOverview application={application} />

            <ApplicationNotes application={application} />

            <ApplicationTimeline timelineItems={timelineItems} />
          </div>

          <div className="space-y-6">
            <ApplicationProgress application={application} status={status} isUpdatingStatus={isUpdatingStatus} statusError={statusError} handleStatusChange={handleStatusChange} validStatuses={validStatuses} formatDeadline={formatDeadline} />

            <ApplicationContact application={application} />

            <section className="panel">
              <Sparkles className="h-5 w-5 text-teal-700" />

              <h2 className="mt-4 text-base font-semibold">
                Prepare your next step
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Review the saved role description and plan your interview
                preparation. Personalised AI analysis is not yet available.
              </p>

              <Link className="btn-secondary mt-5 w-full" href="/ai-assistant">
                Open preparation tools
              </Link>
            </section>
          </div>
        </div>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <DeleteApplicationModal application={application} isDeleting={isDeleting} setShowDeleteModal={setShowDeleteModal} handleDelete={handleDelete} />
      )}
    </DashboardLayout>
  );
}
