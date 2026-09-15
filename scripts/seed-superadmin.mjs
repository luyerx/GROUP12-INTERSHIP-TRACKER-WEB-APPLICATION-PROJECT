// Run once from the project root: node scripts/seed-superadmin.mjs
import nextEnv from "@next/env";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
nextEnv.loadEnvConfig(process.cwd());
const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.SUPERADMIN_PASSWORD;
if (!process.env.MONGODB_URI || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160 || !password || password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
  throw new Error("Set MONGODB_URI, SUPERADMIN_EMAIL and a SUPERADMIN_PASSWORD of at least 12 characters and at most 72 UTF-8 bytes.");
}
const client = new MongoClient(process.env.MONGODB_URI);
try {
  await client.connect();
  const users = client.db(process.env.MONGODB_DB || "internship_tracker").collection("users");
  if (await users.findOne({ role: "superadmin" })) {
    console.log("Super Admin already exists; no account or password changed.");
  } else {
    if (await users.findOne({ email })) throw new Error("Email already belongs to an account. No account was promoted.");
    // Fixed ID makes concurrent runs idempotent without changing database indexes.
    const { ObjectId } = await import("mongodb");
    await users.insertOne({ _id: new ObjectId("000000000000000000000001"), fullName: "Super Admin", email,
      passwordHash: await bcrypt.hash(password, 10), role: "superadmin", status: "Active",
      createdAt: new Date(), updatedAt: new Date() });
    console.log("Super Admin created.");
  }
} finally { await client.close(); }
