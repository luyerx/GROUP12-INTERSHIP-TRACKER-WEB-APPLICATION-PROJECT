import { z } from "zod";
export const opportunityInputSchema = z
  .object({
    organisation: z.string().trim().min(1).max(120),
    role: z.string().trim().min(1).max(160),
    location: z.string().trim().min(1).max(120),
    closingDate: z.iso.date(),
    status: z.enum(["Published", "Draft", "Closed"]),
    description: z.string().trim().max(20000).default(""),
    employmentType: z
      .enum(["Internship", "Graduate", "Part-time"])
      .default("Internship"),
    workMode: z.enum(["On-site", "Hybrid", "Remote"]).default("On-site"),
    applicationUrl: z
      .union([
        z
          .url()
          .refine((v) => /^https?:\/\//i.test(v), "Use an HTTP or HTTPS URL"),
        z.literal(""),
      ])
      .default(""),
  })
  .refine((v) => v.status !== "Published" || v.description.length >= 30, {
    message:
      "Published opportunities need a description of at least 30 characters.",
    path: ["description"],
  });
export type OpportunityInput = z.infer<typeof opportunityInputSchema>;
export type Opportunity = OpportunityInput & {
  id: string;
  createdBy?: string;
  updatedAt: string;
  applicationId?: string;
  publisher?: string;
};
export function todayDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Auckland",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
