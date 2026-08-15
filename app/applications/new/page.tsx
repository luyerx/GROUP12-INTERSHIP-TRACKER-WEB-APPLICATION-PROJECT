import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ApplicationForm from "@/components/applications/ApplicationForm";

export default function NewApplicationPage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link
            href="/applications"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to applications
          </Link>

          <div className="mt-5">
            <p className="text-sm font-medium text-slate-500">
              Application management
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Add a new application
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Record an internship opportunity, track its progress, and keep all
              important information organised in one place.
            </p>
          </div>
        </div>

        <ApplicationForm />
      </div>
    </DashboardLayout>
  );
}