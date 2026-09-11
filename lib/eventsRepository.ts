import "server-only";

import { isObjectIdOrHexString } from "mongoose";
import type { CalendarEventInput } from "@/lib/calendarEvent";
import { connectToDatabase } from "@/lib/mongodb";
import { CalendarEventModel } from "@/lib/models/CalendarEvent";
import { ApplicationModel } from "@/lib/models/Application";

function serialize(document: Record<string, unknown>) {
  return {
    ...document,
    id: String(document._id),
    userId: String(document.userId),
  };
}

export async function listCalendarEvents(userId: string) {
  await connectToDatabase();
  const rows = await CalendarEventModel.find({ userId }).sort({ date: 1, time: 1 }).lean();
  return rows.map((row) => serialize(row as Record<string, unknown>));
}

export async function createCalendarEvent(userId: string, input: CalendarEventInput) {
  await connectToDatabase();
  const application = await ApplicationModel.findOne({ _id: input.applicationId, userId }).select("_id").lean();
  if (!application) return null;
  const row = await CalendarEventModel.create({ ...input, userId });
  return serialize(row.toObject());
}

export async function updateCalendarEvent(id: string, userId: string, input: CalendarEventInput) {
  if (!isObjectIdOrHexString(id)) return null;
  await connectToDatabase();
  const application = await ApplicationModel.findOne({ _id: input.applicationId, userId }).select("_id").lean();
  if (!application) return null;
  const row = await CalendarEventModel.findOneAndUpdate(
    { _id: id, userId }, input, { new: true, runValidators: true }
  ).lean();
  return row ? serialize(row as Record<string, unknown>) : null;
}

export async function deleteCalendarEvent(id: string, userId: string) {
  if (!isObjectIdOrHexString(id)) return null;
  await connectToDatabase();
  const row = await CalendarEventModel.findOneAndDelete({ _id: id, userId }).lean();
  return row ? serialize(row as Record<string, unknown>) : null;
}