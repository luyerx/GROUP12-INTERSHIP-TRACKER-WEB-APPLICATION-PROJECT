import { z } from "zod";

export const calendarEventSchema = z.object({
  applicationId: z.string().trim().regex(/^[a-f\d]{24}$/i, "Invalid application ID."),
  type: z.enum(["deadline", "interview", "reminder"]),
  title: z.string().trim().min(1).max(200),
  organisation: z.string().trim().min(1).max(160),
  date: z.iso.date(),
  time: z.string().trim().regex(/^(?:([01]\d|2[0-3]):[0-5]\d)?$/, "Use HH:mm (00:00–23:59), or leave time empty.").default(""),
  location: z.string().trim().max(160).default(""),
  notes: z.string().trim().max(2000).default(""),
});

export type CalendarEventInput = z.infer<typeof calendarEventSchema>;