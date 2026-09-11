import "server-only";

import { isObjectIdOrHexString } from "mongoose";
import { randomUUID } from "node:crypto";
import type { Application, ApplicationInput, ApplicationStatus } from "@/lib/application";
import { connectToDatabase, hasDatabaseConfig } from "@/lib/mongodb";
import { ApplicationModel } from "@/lib/models/Application";

const now = new Date().toISOString();
const sampleApplications: Application[] = [
  {
    id: "sample-google",
    userId: "demo-student",
    organisation: "Google",
    roleTitle: "Software Engineering Intern",
    location: "Auckland",
    deadline: "2026-08-18",
    status: "Applied",
    sourceLink: "",
    jobDescription: "Build reliable software with a collaborative engineering team.",
    contactPerson: "",
    outcome: "Pending",
    notes: "Review the role requirements before following up.",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "sample-microsoft",
    userId: "demo-student",
    organisation: "Microsoft",
    roleTitle: "Cloud Internship",
    location: "Wellington",
    deadline: "2026-08-20",
    status: "Interview",
    sourceLink: "",
    jobDescription: "Support cloud platform projects and customer-focused engineering.",
    contactPerson: "",
    outcome: "Pending",
    notes: "Prepare examples of teamwork and technical problem solving.",
    createdAt: now,
    updatedAt: now,
  },
];

declare global {
  var internshipApplications: Application[] | undefined;
}

const memoryApplications =
  global.internshipApplications || structuredClone(sampleApplications);
global.internshipApplications = memoryApplications;

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
  if (!hasDatabaseConfig()) return memoryApplications.filter((item) => item.userId === userId);
  await connectToDatabase();
  const rows = await ApplicationModel.find({ userId }).sort({ updatedAt: -1 }).lean();
  return rows.map((row: Record<string, unknown>) => serialize(row));
}

export async function getApplication(id: string, userId: string): Promise<Application | null> {
  if (!hasDatabaseConfig()) {
    return memoryApplications.find((item) => item.id === id && item.userId === userId) || null;
  }
  if (!isObjectIdOrHexString(id)) return null;
  await connectToDatabase();
  const row = await ApplicationModel.findOne({ _id: id, userId }).lean();
  return row ? serialize(row as Record<string, unknown>) : null;
}

export async function createApplication(userId: string, input: ApplicationInput): Promise<Application> {
  if (!hasDatabaseConfig()) {
    const timestamp = new Date().toISOString();
    const application = { ...input, id: randomUUID(), userId, createdAt: timestamp, updatedAt: timestamp };
    memoryApplications.unshift(application);
    return application;
  }
  await connectToDatabase();
  const row = await ApplicationModel.create({ ...input, userId });
  return serialize(row.toObject());
}

export async function updateApplication(id: string, userId: string, input: ApplicationInput): Promise<Application | null> {
  if (!hasDatabaseConfig()) {
    const index = memoryApplications.findIndex((item) => item.id === id && item.userId === userId);
    if (index < 0) return null;
    memoryApplications[index] = { ...memoryApplications[index], ...input, updatedAt: new Date().toISOString() };
    return memoryApplications[index];
  }
  if (!isObjectIdOrHexString(id)) return null;
  await connectToDatabase();
  const row = await ApplicationModel.findOneAndUpdate(
    { _id: id, userId }, input, { new: true, runValidators: true }
  ).lean();
  return row ? serialize(row as Record<string, unknown>) : null;
}

export async function deleteApplication(id: string, userId: string): Promise<Application | null> {
  if (!hasDatabaseConfig()) {
    const index = memoryApplications.findIndex((item) => item.id === id && item.userId === userId);
    if (index < 0) return null;
    return memoryApplications.splice(index, 1)[0];
  }
  if (!isObjectIdOrHexString(id)) return null;
  await connectToDatabase();
  const row = await ApplicationModel.findOneAndDelete({ _id: id, userId }).lean();
  return row ? serialize(row as Record<string, unknown>) : null;
}

export async function updateApplicationStatus(id: string, userId: string, status: ApplicationStatus): Promise<Application | null> {
  if (!hasDatabaseConfig()) {
    const application = memoryApplications.find((item) => item.id === id && item.userId === userId);
    if (!application) return null;
    application.status = status;
    application.updatedAt = new Date().toISOString();
    return application;
  }
  if (!isObjectIdOrHexString(id)) return null;
  await connectToDatabase();
  const row = await ApplicationModel.findOneAndUpdate(
    { _id: id, userId }, { $set: { status } }, { new: true, runValidators: true }
  ).lean();
  return row ? serialize(row as Record<string, unknown>) : null;
}
