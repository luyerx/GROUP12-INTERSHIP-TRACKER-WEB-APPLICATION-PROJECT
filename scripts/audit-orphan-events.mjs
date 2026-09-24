// Read-only audit. Explicit database and user scope required; never deletes data.
// MONGODB_DB=<database> node scripts/audit-orphan-events.mjs <user ObjectId>
import { MongoClient, ObjectId } from "mongodb";
import nextEnv from "@next/env";
const database = process.env.MONGODB_DB;
const userId = process.argv[2];
if (!database || !/^[a-f\d]{24}$/i.test(userId || "")) {
  throw new Error("Set MONGODB_DB explicitly and supply one user ObjectId. This audit is read-only.");
}
nextEnv.loadEnvConfig(process.cwd());
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
try {
  await client.connect();
  const db = client.db(database), owner = new ObjectId(userId);
  const applications = await db.collection("applications").find({ userId: owner }, { projection: { _id: 1 } }).toArray();
  const ids = new Set(applications.map(row => String(row._id)));
  const events = db.collection("calendarevents").find({ userId: owner }, { projection: { _id: 1, applicationId: 1 } });
  let count = 0;
  for await (const event of events) {
    if (typeof event.applicationId !== "string" || !ids.has(event.applicationId.toLowerCase())) {
      console.log(JSON.stringify({ eventId: String(event._id), applicationId: event.applicationId })); count++;
    }
  }
  console.log(JSON.stringify({ orphanCount: count, readOnly: true }));
} finally { await client.close(); }
