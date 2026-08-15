import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import ApplicationForm from "@/components/applications/ApplicationForm";

export default function EditApplicationPage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link
            href="/applications/1"
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

        <ApplicationForm />
      </div>
    </DashboardLayout>
  );
}