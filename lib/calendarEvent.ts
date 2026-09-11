import { z } from "zod";

export const calendarEventSchema = z.object({
  applicationId: z.string().trim().min(1),
  type: z.enum(["deadline", "interview", "reminder"]),
  title: z.string().trim().min(1).max(200),
  organisation: z.string().trim().min(1).max(160),
  date: z.iso.date(),
  time: z.string().trim().max(20).default(""),
  location: z.string().trim().max(160).default(""),
  notes: z.string().trim().max(2000).default(""),
});

export type CalendarEventInput = z.infer<typeof calendarEventSchema>;