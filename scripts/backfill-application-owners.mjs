import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || "internship_tracker";
const ownerEmail = process.env.APPLICATION_OWNER_EMAIL?.trim().toLowerCase();

if (!uri || !ownerEmail) {
  throw new Error("MONGODB_URI and APPLICATION_OWNER_EMAIL are required.");
}

const client = new MongoClient(uri);

try {
  await client.connect();

  const database = client.db(databaseName);
  const user = await database.collection("users").findOne({ email: ownerEmail });

  if (!user) {
    throw new Error(`No user found for ${ownerEmail}.`);
  }

  const result = await database.collection("applications").updateMany(
    { $or: [{ userId: { $exists: false } }, { userId: null }] },
    { $set: { userId: user._id } }
  );

  console.log(`Assigned ${result.modifiedCount} existing applications to ${ownerEmail}.`);
} finally {
  await client.close();
}