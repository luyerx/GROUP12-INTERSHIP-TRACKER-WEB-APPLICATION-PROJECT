import "server-only";

import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;

declare global {
  var mongooseConnection: Promise<typeof mongoose> | undefined;
}

export function hasDatabaseConfig() {
  return Boolean(uri);
}

export async function connectToDatabase() {
  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (!global.mongooseConnection) {
    global.mongooseConnection = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB || "internship_tracker",
      bufferCommands: false,
    });
  }

  return global.mongooseConnection;
}
