"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  ExternalLink,
  MapPin,
  Pencil,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";

type Application = {
  id: number;
  organisation: string;
  roleTitle: string;
  location: string;
  deadline: string;
  status: string;
  sourceLink?: string;
  contactPerson?: string;
  jobDescription?: string;
  notes?: string;
};

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadApplication = async () => {
      try {
        const response = await fetch(`/api/applications/${id}`);
        const result = await response.json();

        if (response.ok) {
          setApplication(result.data);
        } else {
          setError(result.message || "Failed to load application.");
        }
      } catch (error) {
        console.error("Load application error:", error);
        setError("Something went wrong while loading the application.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadApplication();
    }
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Failed to delete application.");
        return;
      }

      alert("Application deleted successfully.");

      router.push("/applications");
    } catch (error) {
      console.error("Delete application error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading application...
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

          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {error || "Application not found."}
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
              {application.organisation.charAt(0)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                  {application.roleTitle}
                </h1>

                <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                  {application.status}
                </span>
              </div>

              <p className="mt-2 text-base font-medium text-slate-600">
                {application.organisation}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {application.location || "No location"}
                </span>

                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  Deadline{" "}
                  {application.deadline
                    ? new Date(application.deadline).toLocaleDateString("en-NZ", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Not set"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/ai-assistant"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Sparkles className="h-4 w-4" />
              AI summary
            </Link>

            <Link
              href={`/applications/${id}/edit`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Link>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3.5 py-2.5 text-sm font-medium text-rose-600 shadow-sm transition hover:bg-rose-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Content */}
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
                    Original details saved with this application.
                  </p>
                </div>
              </div>

              <p className="mt-6 text-sm leading-7 text-slate-600">
                {application.jobDescription || "No job description added."}
              </p>

              {application.sourceLink && (
                <a
                  href={application.sourceLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
                >
                  View original job posting
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">
                Notes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Personal preparation and follow-up information.
              </p>

              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {application.notes || "No notes added."}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">
                Application timeline
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                A history of important application milestones.
              </p>

              <div className="mt-6 space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-slate-950" />

                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Application created
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Current application record
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-slate-300 bg-white" />

                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Current stage: {application.status}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Latest status
                    </p>
                  </div>
                </div>
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

                  <p className="mt-1.5 text-sm font-medium text-slate-800">
                    {application.status}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Deadline
                  </p>

                  <p className="mt-1.5 text-sm font-medium text-slate-800">
                    {application.deadline
                      ? new Date(application.deadline).toLocaleDateString(
                          "en-NZ",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )
                      : "Not set"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Location
                  </p>

                  <p className="mt-1.5 text-sm font-medium text-slate-800">
                    {application.location || "Not set"}
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
                {application.contactPerson || "No contact added"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Recruiter / hiring contact
              </p>
            </section>

            <section className="rounded-2xl border border-slate-900 bg-slate-950 p-6 text-white shadow-sm">
              <Sparkles className="h-5 w-5 text-slate-300" />

              <h2 className="mt-4 text-base font-semibold">
                Prepare with AI
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Generate a concise job summary or practice interview questions
                using the saved role description.
              </p>

              <Link
                href="/ai-assistant"
                className="mt-5 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-slate-100"
              >
                Open AI assistant
              </Link>
            </section>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close delete confirmation"
            onClick={() => {
              if (!isDeleting) {
                setShowDeleteModal(false);
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
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-950">
              Delete application?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              You are about to permanently delete the application for{" "}
              <span className="font-medium text-slate-700">
                {application.roleTitle}
              </span>{" "}
              at{" "}
              <span className="font-medium text-slate-700">
                {application.organisation}
              </span>
              .
            </p>

            <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/60 px-4 py-3">
              <p className="text-xs leading-5 text-rose-700">
                This action cannot be undone once the application is deleted.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="inline-flex min-w-35 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />

                {isDeleting ? "Deleting..." : "Delete application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
