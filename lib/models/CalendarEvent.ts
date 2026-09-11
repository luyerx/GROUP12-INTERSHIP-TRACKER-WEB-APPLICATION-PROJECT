import "server-only";

import { model, models, Schema } from "mongoose";

const calendarEventSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    applicationId: { type: String, required: true, trim: true },
    type: { type: String, enum: ["deadline", "interview", "reminder"], required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    organisation: { type: String, required: true, trim: true, maxlength: 160 },
    date: { type: String, required: true, trim: true },
    time: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true, maxlength: 160 },
    notes: { type: String, default: "", maxlength: 2000 },
  },
  { timestamps: true }
);

export const CalendarEventModel = models.CalendarEvent || model("CalendarEvent", calendarEventSchema);