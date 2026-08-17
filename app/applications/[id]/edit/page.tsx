"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import {
  AlertCircle,
  ArrowLeft,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ApplicationForm from "@/components/applications/ApplicationForm";

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
  sourceLink?: string;
  deadline: string;
  status: ApplicationStatus;
  jobDescription?: string;
  contactPerson?: string;
  outcome?: string;
  notes?: string;
};

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
    sourceLink: application.sourceLink ?? "",
    deadline: application.deadline ?? "",
    status,
    jobDescription: application.jobDescription ?? "",
    contactPerson: application.contactPerson ?? "",
    outcome: application.outcome ?? "",
    notes: application.notes ?? "",
  };
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

export default function EditApplicationPage() {
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
                : "Something went wrong while loading the application."
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
      } catch (error) {
        console.error(
          "Load application error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Something went wrong while loading the application."
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link
            href={`/applications/${id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to application
          </Link>

          <div className="mt-5">
            <p className="text-sm font-medium text-slate-500">
              Application management
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Edit application
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Update the core application
              information, deadline, location,
              and current stage.
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <LoaderCircle className="h-6 w-6 animate-spin text-slate-500" />

            <p className="mt-4 text-sm font-medium text-slate-700">
              Loading application...
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Retrieving the latest application details.
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-rose-200 bg-white px-6 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertCircle className="h-5 w-5" />
            </div>

            <h2 className="mt-4 text-base font-semibold text-slate-950">
              Unable to load application
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {error}
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
        )}

        {/* Form */}
        {!loading &&
          !error &&
          application && (
            <ApplicationForm
              mode="edit"
              applicationId={id}
              initialValues={
                application
              }
            />
          )}
      </div>
    </DashboardLayout>
  );
}