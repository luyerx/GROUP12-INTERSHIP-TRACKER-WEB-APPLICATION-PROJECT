import { z } from "zod";

export const applicationStatuses = [
  "Interested",
  "Preparing",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
] as const;

export const applicationInputSchema = z.object({
  organisation: z.string().trim().min(1, "Organisation is required").max(120),
  roleTitle: z.string().trim().min(1, "Role title is required").max(160),
  location: z.string().trim().max(120).default(""),
  sourceLink: z.union([z.url("Please enter a valid URL"), z.literal("")]).default(""),
  deadline: z.union([z.iso.date(), z.literal("")]).default(""),
  status: z.enum(applicationStatuses).default("Interested"),
  jobDescription: z.string().trim().max(20000).default(""),
  contactPerson: z.string().trim().max(160).default(""),
  outcome: z.string().trim().max(120).default(""),
  notes: z.string().trim().max(10000).default(""),
});

export type ApplicationInput = z.infer<typeof applicationInputSchema>;
export type ApplicationStatus = (typeof applicationStatuses)[number];

export type Application = ApplicationInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};
