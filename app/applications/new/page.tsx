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

            <h1 className="mt-2 page-title">Add External Application</h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Found a role on LinkedIn, Seek or a company website? Add it here
              to track your progress. For roles published in this system, browse
              Opportunities first.
            </p>
          </div>
        </div>

        <ApplicationForm />
      </div>
    </DashboardLayout>
  );
}
