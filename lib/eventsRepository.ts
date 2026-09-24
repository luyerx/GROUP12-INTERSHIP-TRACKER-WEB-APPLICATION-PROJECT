import "server-only";

import { isObjectIdOrHexString, type ClientSession } from "mongoose";
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
  const applicationIds = rows.map((row) => row.applicationId)
    .filter((id): id is string => typeof id === "string" && isObjectIdOrHexString(id));
  const applications = await ApplicationModel.find({ _id: { $in: applicationIds }, userId }).select("_id").lean();
  const ownedIds = new Set(applications.map((row) => String(row._id)));
  // Existing orphan and cross-owner references must never become navigation links.
  return rows.filter((row) => typeof row.applicationId === "string" && ownedIds.has(row.applicationId.toLowerCase()))
    .map((row) => serialize(row as Record<string, unknown>));
}

async function lockApplication(applicationId: string, userId: string, session: ClientSession) {
  // A read alone is insufficient: snapshot isolation would allow a concurrent delete.
  // $inc also works on legacy records without calendarRevision; preserve updatedAt.
  const result = await ApplicationModel.updateOne(
    { _id: applicationId, userId },
    { $inc: { calendarRevision: 1 } },
    { session, timestamps: false },
  );
  return result.matchedCount === 1;
}

export async function createCalendarEvent(userId: string, input: CalendarEventInput) {
  if (!isObjectIdOrHexString(input.applicationId)) return null;
  const mongoose = await connectToDatabase();
  return mongoose.connection.transaction(async (session) => {
    if (!await lockApplication(input.applicationId, userId, session)) return null;
    const [row] = await CalendarEventModel.create(
      [{ ...input, applicationId: input.applicationId.toLowerCase(), userId }], { session },
    );
    return serialize(row.toObject());
  });
}

export async function updateCalendarEvent(id: string, userId: string, input: CalendarEventInput) {
  if (!isObjectIdOrHexString(id) || !isObjectIdOrHexString(input.applicationId)) return null;
  const mongoose = await connectToDatabase();
  return mongoose.connection.transaction(async (session) => {
    if (!await lockApplication(input.applicationId, userId, session)) return null;
    const row = await CalendarEventModel.findOneAndUpdate(
      { _id: id, userId }, { ...input, applicationId: input.applicationId.toLowerCase() },
      { session, returnDocument: "after", runValidators: true },
    ).lean();
    return row ? serialize(row as Record<string, unknown>) : null;
  });
}

export async function deleteCalendarEvent(id: string, userId: string) {
  if (!isObjectIdOrHexString(id)) return null;
  await connectToDatabase();
  const row = await CalendarEventModel.findOneAndDelete({ _id: id, userId }).lean();
  return row ? serialize(row as Record<string, unknown>) : null;
}