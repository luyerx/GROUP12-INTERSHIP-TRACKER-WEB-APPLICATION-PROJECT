"use client";

import { isDateInputValue, toDateInputValue } from "@/lib/date";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  Link2,
  LoaderCircle,
  MapPin,
  UserRound,
} from "lucide-react";

const applicationStatuses = [
  "Interested",
  "Preparing",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
] as const;

const applicationSchema = z.object({
  organisation: z.string().trim().min(1, "Organisation is required"),

  roleTitle: z.string().trim().min(1, "Role title is required"),

  location: z.string().optional(),

  sourceLink: z
    .string()
    .url("Please enter a valid URL")
    .or(z.literal(""))
    .optional(),

  deadline: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value) {
          return true;
        }

        return isDateInputValue(value);
      },
      {
        message: "Please select a valid date",
      },
    ),

  status: z.enum(applicationStatuses),

  jobDescription: z.string().optional(),

  contactPerson: z.string().optional(),

  outcome: z.string().optional(),

  notes: z.string().optional(),
});

export type ApplicationFormValues = z.infer<typeof applicationSchema>;

type ApplicationFormProps = {
  mode?: "create" | "edit";
  applicationId?: string;
  isSystemTracked?: boolean;
  initialValues?: Partial<ApplicationFormValues>;
};

type ApplicationApiResponse = {
  success: boolean;
  message?: string;
  data?: {
    id: string | number;
    organisation: string;
    roleTitle: string;
    location: string;
    deadline: string;
    status: string;
  };
};

const inputClassName =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const labelClassName = "text-sm font-medium text-slate-700";

export default function ApplicationForm({
  mode = "create",
  applicationId,
  initialValues,
  isSystemTracked = false,
}: ApplicationFormProps) {
  const router = useRouter();

  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),

    defaultValues: {
      organisation: initialValues?.organisation ?? "",

      roleTitle: initialValues?.roleTitle ?? "",

      location: initialValues?.location ?? "",

      sourceLink: initialValues?.sourceLink ?? "",

      deadline: toDateInputValue(initialValues?.deadline ?? ""),

      status: initialValues?.status ?? "Interested",

      jobDescription: initialValues?.jobDescription ?? "",

      contactPerson: initialValues?.contactPerson ?? "",

      outcome: initialValues?.outcome ?? "",

      notes: initialValues?.notes ?? "",
    },
  });

  const onSubmit = async (data: ApplicationFormValues) => {
    setSubmitError("");

    const payload = {
      organisation: data.organisation.trim(),

      roleTitle: data.roleTitle.trim(),

      location: data.location?.trim() ?? "",

      sourceLink: data.sourceLink?.trim() ?? "",

      deadline: data.deadline?.trim() ?? "",

      status: data.status,

      jobDescription: data.jobDescription?.trim() ?? "",

      contactPerson: data.contactPerson?.trim() ?? "",

      outcome: data.outcome?.trim() ?? "",

      notes: data.notes?.trim() ?? "",
    };

    try {
      /*
       * EDIT
       */
      if (mode === "edit") {
        if (!applicationId) {
          setSubmitError("Application ID is missing.");

          return;
        }

        const response = await fetch(`/api/applications/${applicationId}`, {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(payload),
        });

        const result: ApplicationApiResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to update application.");
        }

        router.push(`/applications/${applicationId}`);

        router.refresh();

        return;
      }

      /*
       * CREATE
       */
      const response = await fetch("/api/applications", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      const result: ApplicationApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to create application.");
      }

      /*
       * If the backend returns the new
       * application ID, go directly to
       * its detail page.
       */
      if (result.data?.id) {
        router.push(`/applications/${result.data.id}`);
      } else {
        router.push("/applications");
      }

      router.refresh();
    } catch (error) {
      console.error("Application save error:", error);

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  const handleCancel = () => {
    if (mode === "edit" && applicationId) {
      router.push(`/applications/${applicationId}`);

      return;
    }

    router.push("/applications");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic information */}
      <section className="card p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <BriefcaseBusiness className="h-5 w-5" strokeWidth={1.8} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Basic information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isSystemTracked ? "Opportunity information is read-only and managed by the employer or admin. You can edit your personal tracking details below." : "Add the main details about the external internship opportunity."}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Organisation */}
          <div>
            <label htmlFor="organisation" className={labelClassName}>
              Organisation <span className="text-rose-500">*</span>
            </label>

            <input
              id="organisation"
              readOnly={isSystemTracked}
              aria-invalid={Boolean(errors.organisation)}
              aria-describedby={
                errors.organisation ? "organisation-error" : undefined
              }
              type="text"
              disabled={isSubmitting}
              placeholder="e.g. Xero"
              className={`${inputClassName} ${
                errors.organisation
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : ""
              }`}
              {...register("organisation")}
            />

            {errors.organisation && (
              <p
                id="organisation-error"
                role="alert"
                className="mt-2 text-xs font-medium text-rose-600"
              >
                {errors.organisation.message}
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label htmlFor="roleTitle" className={labelClassName}>
              Role title <span className="text-rose-500">*</span>
            </label>

            <input
              id="roleTitle"
              readOnly={isSystemTracked}
              aria-invalid={Boolean(errors.roleTitle)}
              aria-describedby={
                errors.roleTitle ? "roleTitle-error" : undefined
              }
              type="text"
              disabled={isSubmitting}
              placeholder="e.g. Graduate Software Developer"
              className={`${inputClassName} ${
                errors.roleTitle
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : ""
              }`}
              {...register("roleTitle")}
            />

            {errors.roleTitle && (
              <p
                id="roleTitle-error"
                role="alert"
                className="mt-2 text-xs font-medium text-rose-600"
              >
                {errors.roleTitle.message}
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className={labelClassName}>
              Location
            </label>

            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                id="location"
              readOnly={isSystemTracked}
                aria-invalid={Boolean(errors.location)}
                aria-describedby={
                  errors.location ? "location-error" : undefined
                }
                type="text"
                disabled={isSubmitting}
                placeholder="e.g. Auckland"
                className={`${inputClassName} pl-10`}
                {...register("location")}
              />
            </div>
          </div>

          {/* Source link */}
          <div>
            <label htmlFor="sourceLink" className={labelClassName}>
              Source link
            </label>

            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3.5 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                id="sourceLink"
              readOnly={isSystemTracked}
                type="url"
                disabled={isSubmitting}
                placeholder="https://example.com/job"
                className={`${inputClassName} pl-10`}
                aria-invalid={Boolean(errors.sourceLink)}
                aria-describedby={
                  errors.sourceLink ? "sourceLink-error" : undefined
                }
                {...register("sourceLink")}
              />
            </div>
            {errors.sourceLink && (
              <p
                id="sourceLink-error"
                className="mt-2 text-xs font-medium text-rose-600"
              >
                {errors.sourceLink.message}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Application details */}
      <section className="card p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <CalendarDays className="h-5 w-5" strokeWidth={1.8} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Application details
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Track the deadline and current application stage.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Deadline */}
          <div>
            <label htmlFor="deadline" className={labelClassName}>
              Deadline
            </label>

            <input
              id="deadline"
              readOnly={isSystemTracked}
              aria-invalid={Boolean(errors.deadline)}
              aria-describedby={errors.deadline ? "deadline-error" : undefined}
              type="date"
              lang="en-NZ"
              disabled={isSubmitting}
              className={`${inputClassName} ${
                errors.deadline
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : ""
              }`}
              {...register("deadline")}
            />

            {errors.deadline && (
              <p
                id="deadline-error"
                role="alert"
                className="mt-2 text-xs font-medium text-rose-600"
              >
                {errors.deadline.message}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className={labelClassName}>
              Application status
            </label>

            <select
              id="status"
              disabled={isSubmitting}
              className={inputClassName}
              {...register("status")}
            >
              {applicationStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Job description */}
        <div className="mt-5">
          <label htmlFor="jobDescription" className={labelClassName}>
            Job description
          </label>

          <div className="relative">
            <FileText className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-slate-500" />

            <textarea
              id="jobDescription"
              readOnly={isSystemTracked}
              rows={6}
              disabled={isSubmitting}
              placeholder="Paste the job description or key requirements..."
              className={`${inputClassName} resize-none pl-10`}
              {...register("jobDescription")}
            />
          </div>
        </div>
      </section>

      {/* Personal tracking information */}
      <section className="card p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <UserRound className="h-5 w-5" strokeWidth={1.8} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Additional information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add optional contact, outcome, and personal notes.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="contactPerson" className={labelClassName}>
              Contact person
            </label>

            <input
              id="contactPerson"
              type="text"
              disabled={isSubmitting}
              placeholder="e.g. Hiring manager name"
              className={inputClassName}
              {...register("contactPerson")}
            />
          </div>

          <div>
            <label htmlFor="outcome" className={labelClassName}>
              Outcome
            </label>

            <select
              id="outcome"
              disabled={isSubmitting}
              className={inputClassName}
              {...register("outcome")}
            >
              <option value="">Not recorded</option>
              <option value="Pending">Pending</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="notes" className={labelClassName}>
            Notes
          </label>

          <textarea
            id="notes"
            rows={4}
            disabled={isSubmitting}
            placeholder="Add preparation notes, follow-ups, or reminders..."
            className={`${inputClassName} resize-none`}
            {...register("notes")}
          />
        </div>
      </section>

      {/* API error */}
      {submitError && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />

            <div>
              <p className="text-sm font-semibold text-rose-800">
                Unable to save application
              </p>

              <p className="mt-1 text-sm leading-6 text-rose-700">
                {submitError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn min-w-40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />

              {mode === "edit" ? "Saving changes..." : "Saving..."}
            </>
          ) : mode === "edit" ? (
            "Save changes"
          ) : (
            "Save application"
          )}
        </button>
      </div>
    </form>
  );
}
