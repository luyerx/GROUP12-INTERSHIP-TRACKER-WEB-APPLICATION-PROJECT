import "server-only";

import { isObjectIdOrHexString } from "mongoose";
import type {
  Application,
  ApplicationInput,
  ApplicationStatus,
} from "@/lib/application";
import { connectToDatabase } from "@/lib/mongodb";
import { ApplicationModel } from "@/lib/models/Application";

function serialize(document: Record<string, unknown>): Application {
  return {
    ...document,
    id: String(document._id),
    userId: String(document.userId),
    createdAt: new Date(document.createdAt as string | Date).toISOString(),
    updatedAt: new Date(document.updatedAt as string | Date).toISOString(),
  } as Application;
}

export async function listApplications(userId: string): Promise<Application[]> {
  await connectToDatabase();
  const rows = await ApplicationModel.find({ userId })
    .sort({ updatedAt: -1 })
    .lean();
  return rows.map((row: Record<string, unknown>) => serialize(row));
}

export async function getApplication(
  id: string,
  userId: string,
): Promise<Application | null> {
  if (!isObjectIdOrHexString(id)) return null;
  await connectToDatabase();
  const row = await ApplicationModel.findOne({ _id: id, userId }).lean();
  return row ? serialize(row as Record<string, unknown>) : null;
}

export async function createApplication(
  userId: string,
  input: ApplicationInput,
): Promise<Application> {
  await connectToDatabase();
  const row = await ApplicationModel.create({ ...input, userId });
  return serialize(row.toObject());
}

export async function updateApplication(
  id: string,
  userId: string,
  input: ApplicationInput,
): Promise<Application | null> {
  if (!isObjectIdOrHexString(id)) return null;
  await connectToDatabase();
  const row = await ApplicationModel.findOneAndUpdate(
    { _id: id, userId },
    input,
    { returnDocument: "after", runValidators: true },
  ).lean();
  return row ? serialize(row as Record<string, unknown>) : null;
}

export async function deleteApplication(
  id: string,
  userId: string,
): Promise<Application | null> {
  if (!isObjectIdOrHexString(id)) return null;
  await connectToDatabase();
  const row = await ApplicationModel.findOneAndDelete({
    _id: id,
    userId,
  }).lean();
  return row ? serialize(row as Record<string, unknown>) : null;
}

export async function updateApplicationStatus(
  id: string,
  userId: string,
  status: ApplicationStatus,
): Promise<Application | null> {
  if (!isObjectIdOrHexString(id)) return null;
  await connectToDatabase();
  const row = await ApplicationModel.findOneAndUpdate(
    { _id: id, userId },
    { $set: { status } },
    { returnDocument: "after", runValidators: true },
  ).lean();
  return row ? serialize(row as Record<string, unknown>) : null;
}
