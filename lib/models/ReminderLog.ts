import "server-only";
import { model, models, Schema } from "mongoose";

const reminderLogSchema = new Schema({
  key: { type: String, required: true, unique: true },
  state: { type: String, enum: ["claimed", "sending", "sent"], required: true },
  token: { type: String, required: true },
  leaseUntil: { type: Date, required: true },
  sentAt: { type: Date },
}, { timestamps: true });

export const ReminderLogModel = models.ReminderLog || model("ReminderLog", reminderLogSchema);
