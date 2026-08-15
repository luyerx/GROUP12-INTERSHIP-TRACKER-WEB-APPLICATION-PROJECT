"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  Link2,
  MapPin,
  UserRound,
} from "lucide-react";

const applicationSchema = z.object({
  organisation: z.string().min(1, "Organisation is required"),

  roleTitle: z.string().min(1, "Role title is required"),

  location: z.string().optional(),

  sourceLink: z
    .string()
    .url("Please enter a valid URL")
    .or(z.literal(""))
    .optional(),

  deadline: z.string().optional(),

  status: z.enum([
    "Interested",
    "Preparing",
    "Applied",
    "Interview",
    "Offer",
    "Rejected",
    "Withdrawn",
  ]),

  jobDescription: z.string().optional(),

  contactPerson: z.string().optional(),

  outcome: z.string().optional(),

  notes: z.string().optional(),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

type ApplicationFormProps = {
  mode?: "create" | "edit";
  initialValues?: Partial<ApplicationFormValues>;
};

const inputClassName =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100";

const labelClassName = "text-sm font-medium text-slate-700";

export default function ApplicationForm({
  mode = "create",
  initialValues,
}: ApplicationFormProps) {
  const router = useRouter();

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
      deadline: initialValues?.deadline ?? "",
      status: initialValues?.status ?? "Interested",
      jobDescription: initialValues?.jobDescription ?? "",
      contactPerson: initialValues?.contactPerson ?? "",
      outcome: initialValues?.outcome ?? "",
      notes: initialValues?.notes ?? "",
    },
  });

  const onSubmit = async (data: ApplicationFormValues) => {
    console.log(
      mode === "edit"
        ? "Updated application data:"
        : "New application data:",
      data
    );

    // Temporary simulated save.
    // Later this will be replaced with API requests.
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (mode === "edit") {
      router.push("/applications/1");
    } else {
      router.push("/applications");
    }
  };

  const handleCancel = () => {
    if (mode === "edit") {
      router.push("/applications/1");
    } else {
      router.push("/applications");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              Add the main details about the internship opportunity.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Organisation */}
          <div>
            <label className={labelClassName}>
              Organisation <span className="text-rose-500">*</span>
            </label>

            <input
              type="text"
              placeholder="e.g. Xero"
              className={`${inputClassName} ${
                errors.organisation
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : ""
              }`}
              {...register("organisation")}
            />

            {errors.organisation && (
              <p className="mt-2 text-xs font-medium text-rose-600">
                {errors.organisation.message}
              </p>
            )}
          </div>

          {/* Role title */}
          <div>
            <label className={labelClassName}>
              Role title <span className="text-rose-500">*</span>
            </label>

            <input
              type="text"
              placeholder="e.g. Graduate Software Developer"
              className={`${inputClassName} ${
                errors.roleTitle
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : ""
              }`}
              {...register("roleTitle")}
            />

            {errors.roleTitle && (
              <p className="mt-2 text-xs font-medium text-rose-600">
                {errors.roleTitle.message}
              </p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className={labelClassName}>
              Location
            </label>

            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-5.25 h-4 w-4 text-slate-400" />

              <input
                type="text"
                placeholder="e.g. Auckland"
                className={`${inputClassName} pl-10`}
                {...register("location")}
              />
            </div>
          </div>

          {/* Source link */}
          <div>
            <label className={labelClassName}>
              Source link
            </label>

            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3.5 top-5.25 h-4 w-4 text-slate-400" />

              <input
                type="url"
                placeholder="https://..."
                className={`${inputClassName} pl-10 ${
                  errors.sourceLink
                    ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                    : ""
                }`}
                {...register("sourceLink")}
              />
            </div>

            {errors.sourceLink && (
              <p className="mt-2 text-xs font-medium text-rose-600">
                {errors.sourceLink.message}
              </p>
            )}
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
                Track the deadline, current stage, and original job description.
            </p>
            </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Deadline */}
            <div>
            <label className={labelClassName}>
                Deadline
            </label>

            <input
            type="text"
            placeholder="DD/MM/YYYY"
            className={inputClassName}
            {...register("deadline")}
            />
            </div>

            {/* Status */}
            <div>
            <label className={labelClassName}>
                Application status
            </label>

            <select
                className={inputClassName}
                {...register("status")}
            >
                <option value="Interested">Interested</option>
                <option value="Preparing">Preparing</option>
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
                <option value="Withdrawn">Withdrawn</option>
            </select>
            </div>
        </div>

        {/* Job description */}
        <div className="mt-5">
            <label className={labelClassName}>
            Job description
            </label>

            <div className="relative">
            <FileText className="pointer-events-none absolute left-3.5 top-5 h-4 w-4 text-slate-400" />

            <textarea
                rows={7}
                placeholder="Paste the job description here. This can later be used by the AI assistant to generate a concise summary."
                className={`${inputClassName} resize-none pl-10`}
                {...register("jobDescription")}
            />
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-400">
            Only include information you are comfortable storing in the system.
            </p>
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
            <h2 className="text-base font-semibold text-slate-950">
              Additional information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Optional details that can help you manage the application later.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Contact person */}
          <div>
            <label className={labelClassName}>
              Contact person
            </label>

            <input
              type="text"
              placeholder="Recruiter or hiring manager"
              className={inputClassName}
              {...register("contactPerson")}
            />
          </div>

          {/* Outcome */}
          <div>
            <label className={labelClassName}>
              Outcome
            </label>

            <select
              className={inputClassName}
              {...register("outcome")}
            >
              <option value="">No outcome yet</option>
              <option value="Pending">Pending</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-5">
          <label className={labelClassName}>
            Notes
          </label>

          <textarea
            rows={4}
            placeholder="Add preparation notes, follow-up reminders, recruiter comments, or anything else useful..."
            className={`${inputClassName} resize-none`}
            {...register("notes")}
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
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
          className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? mode === "edit"
              ? "Saving changes..."
              : "Saving..."
            : mode === "edit"
              ? "Save changes"
              : "Save application"}
        </button>
      </div>
    </form>
  );
}