"use client";

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
  Info,
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
  organisation: z
    .string()
    .trim()
    .min(1, "Organisation is required"),

  roleTitle: z
    .string()
    .trim()
    .min(1, "Role title is required"),

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

        return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(
          value
        );
      },
      {
        message:
          "Please use DD/MM/YYYY format",
      }
    ),

  status: z.enum(applicationStatuses),

  jobDescription: z.string().optional(),

  contactPerson: z.string().optional(),

  outcome: z.string().optional(),

  notes: z.string().optional(),
});

export type ApplicationFormValues =
  z.infer<typeof applicationSchema>;

type ApplicationFormProps = {
  mode?: "create" | "edit";
  applicationId?: string;
  initialValues?: Partial<ApplicationFormValues>;
};

type ApplicationApiResponse = {
  success: boolean;
  message?: string;
  data?: {
    id: number;
    organisation: string;
    roleTitle: string;
    location: string;
    deadline: string;
    status: string;
  };
};

const inputClassName =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const labelClassName =
  "text-sm font-medium text-slate-700";

const disabledInputClassName =
  "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-400 outline-none cursor-not-allowed";

export default function ApplicationForm({
  mode = "create",
  applicationId,
  initialValues,
}: ApplicationFormProps) {
  const router = useRouter();

  const [submitError, setSubmitError] =
    useState("");

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } =
    useForm<ApplicationFormValues>({
      resolver:
        zodResolver(
          applicationSchema
        ),

      defaultValues: {
        organisation:
          initialValues?.organisation ??
          "",

        roleTitle:
          initialValues?.roleTitle ??
          "",

        location:
          initialValues?.location ?? "",

        sourceLink:
          initialValues?.sourceLink ??
          "",

        deadline:
          initialValues?.deadline ?? "",

        status:
          initialValues?.status ??
          "Interested",

        jobDescription:
          initialValues?.jobDescription ??
          "",

        contactPerson:
          initialValues?.contactPerson ??
          "",

        outcome:
          initialValues?.outcome ?? "",

        notes:
          initialValues?.notes ?? "",
      },
    });

  const onSubmit = async (
    data: ApplicationFormValues
  ) => {
    setSubmitError("");

    /*
     * IMPORTANT:
     *
     * The current backend API only
     * persists these five fields.
     *
     * Additional fields will be added
     * when the backend schema is extended.
     */
    const payload = {
      organisation:
        data.organisation.trim(),

      roleTitle:
        data.roleTitle.trim(),

      location:
        data.location?.trim() ?? "",

      deadline:
        data.deadline?.trim() ?? "",

      status: data.status,
    };

    try {
      /*
       * EDIT
       */
      if (mode === "edit") {
        if (!applicationId) {
          setSubmitError(
            "Application ID is missing."
          );

          return;
        }

        const response =
          await fetch(
            `/api/applications/${applicationId}`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                payload
              ),
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
              "Failed to update application."
          );
        }

        router.push(
          `/applications/${applicationId}`
        );

        router.refresh();

        return;
      }

      /*
       * CREATE
       */
      const response = await fetch(
        "/api/applications",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            payload
          ),
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
            "Failed to create application."
        );
      }

      /*
       * If the backend returns the new
       * application ID, go directly to
       * its detail page.
       */
      if (result.data?.id) {
        router.push(
          `/applications/${result.data.id}`
        );
      } else {
        router.push(
          "/applications"
        );
      }

      router.refresh();
    } catch (error) {
      console.error(
        "Application save error:",
        error
      );

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    }
  };

  const handleCancel = () => {
    if (
      mode === "edit" &&
      applicationId
    ) {
      router.push(
        `/applications/${applicationId}`
      );

      return;
    }

    router.push(
      "/applications"
    );
  };

  return (
    <form
      onSubmit={handleSubmit(
        onSubmit
      )}
      className="space-y-6"
    >
      {/* Integration notice */}
      <section className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-blue-200">
            <Info className="h-4 w-4" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">
              Application data
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              Core application
              information is currently
              connected to the backend.
              Additional fields such as
              job descriptions, contacts,
              and notes will become
              available once backend
              support is completed.
            </p>
          </div>
        </div>
      </section>

      {/* Basic information */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <BriefcaseBusiness
              className="h-5 w-5"
              strokeWidth={1.8}
            />
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Basic information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add the main details
              about the internship
              opportunity.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Organisation */}
          <div>
            <label
              htmlFor="organisation"
              className={
                labelClassName
              }
            >
              Organisation{" "}
              <span className="text-rose-500">
                *
              </span>
            </label>

            <input
              id="organisation"
              type="text"
              disabled={isSubmitting}
              placeholder="e.g. Xero"
              className={`${inputClassName} ${
                errors.organisation
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : ""
              }`}
              {...register(
                "organisation"
              )}
            />

            {errors.organisation && (
              <p className="mt-2 text-xs font-medium text-rose-600">
                {
                  errors.organisation
                    .message
                }
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label
              htmlFor="roleTitle"
              className={
                labelClassName
              }
            >
              Role title{" "}
              <span className="text-rose-500">
                *
              </span>
            </label>

            <input
              id="roleTitle"
              type="text"
              disabled={isSubmitting}
              placeholder="e.g. Graduate Software Developer"
              className={`${inputClassName} ${
                errors.roleTitle
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : ""
              }`}
              {...register(
                "roleTitle"
              )}
            />

            {errors.roleTitle && (
              <p className="mt-2 text-xs font-medium text-rose-600">
                {
                  errors.roleTitle
                    .message
                }
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className={
                labelClassName
              }
            >
              Location
            </label>

            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="location"
                type="text"
                disabled={
                  isSubmitting
                }
                placeholder="e.g. Auckland"
                className={`${inputClassName} pl-10`}
                {...register(
                  "location"
                )}
              />
            </div>
          </div>

          {/* Source link pending */}
          <div>
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="sourceLink"
                className={
                  labelClassName
                }
              >
                Source link
              </label>

              <PendingBadge />
            </div>

            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3.5 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-slate-300" />

              <input
                id="sourceLink"
                type="text"
                disabled
                placeholder="Backend support pending"
                className={`${disabledInputClassName} pl-10`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Application details */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <CalendarDays
              className="h-5 w-5"
              strokeWidth={1.8}
            />
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Application details
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Track the deadline and
              current application stage.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Deadline */}
          <div>
            <label
              htmlFor="deadline"
              className={
                labelClassName
              }
            >
              Deadline
            </label>

            <input
              id="deadline"
              type="text"
              inputMode="numeric"
              disabled={isSubmitting}
              placeholder="DD/MM/YYYY"
              className={`${inputClassName} ${
                errors.deadline
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : ""
              }`}
              {...register(
                "deadline"
              )}
            />

            {errors.deadline && (
              <p className="mt-2 text-xs font-medium text-rose-600">
                {
                  errors.deadline
                    .message
                }
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className={
                labelClassName
              }
            >
              Application status
            </label>

            <select
              id="status"
              disabled={isSubmitting}
              className={
                inputClassName
              }
              {...register(
                "status"
              )}
            >
              {applicationStatuses.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* Job description pending */}
        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="jobDescription"
              className={
                labelClassName
              }
            >
              Job description
            </label>

            <PendingBadge />
          </div>

          <div className="relative">
            <FileText className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-slate-300" />

            <textarea
              id="jobDescription"
              rows={6}
              disabled
              placeholder="Job description storage will be enabled when backend support is available."
              className={`${disabledInputClassName} resize-none pl-10`}
            />
          </div>
        </div>
      </section>

      {/* Additional information */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <UserRound
              className="h-5 w-5"
              strokeWidth={1.8}
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-slate-950">
                Additional
                information
              </h2>

              <PendingBadge />
            </div>

            <p className="mt-1 text-sm text-slate-500">
              These optional fields
              are prepared in the
              frontend and will be
              enabled after the
              backend schema is
              extended.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="contactPerson"
              className={
                labelClassName
              }
            >
              Contact person
            </label>

            <input
              id="contactPerson"
              type="text"
              disabled
              placeholder="Backend support pending"
              className={
                disabledInputClassName
              }
            />
          </div>

          <div>
            <label
              htmlFor="outcome"
              className={
                labelClassName
              }
            >
              Outcome
            </label>

            <select
              id="outcome"
              disabled
              className={
                disabledInputClassName
              }
            >
              <option>
                Backend support
                pending
              </option>
            </select>
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor="notes"
            className={
              labelClassName
            }
          >
            Notes
          </label>

          <textarea
            id="notes"
            rows={4}
            disabled
            placeholder="Notes storage will be enabled when backend support is available."
            className={`${disabledInputClassName} resize-none`}
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
                Unable to save
                application
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
          className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />

              {mode === "edit"
                ? "Saving changes..."
                : "Saving..."}
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

function PendingBadge() {
  return (
    <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-amber-700 ring-1 ring-inset ring-amber-200">
      Integration pending
    </span>
  );
}