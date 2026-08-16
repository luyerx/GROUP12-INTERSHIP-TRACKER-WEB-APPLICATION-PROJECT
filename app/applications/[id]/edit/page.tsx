"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ApplicationForm from "@/components/applications/ApplicationForm";

type Application = {
  id: number;
  organisation: string;
  roleTitle: string;
  location: string;
  sourceLink?: string;
  deadline: string;
  status:
    | "Interested"
    | "Preparing"
    | "Applied"
    | "Interview"
    | "Offer"
    | "Rejected"
    | "Withdrawn";
  jobDescription?: string;
  contactPerson?: string;
  outcome?: string;
  notes?: string;
};

export default function EditApplicationPage() {
  const params = useParams();
  const id = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
              Update application details, status, deadline, and notes.
            </p>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading application...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!loading && !error && application && (
          <ApplicationForm
            mode="edit"
            applicationId={id}
            initialValues={application}
          />
        )}
      </div>
    </DashboardLayout>
  );
}