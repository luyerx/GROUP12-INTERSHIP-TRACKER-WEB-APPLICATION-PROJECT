// Default: read-only verification of the configured database and actual GET handler.
// --integration: exercise setup and repeat-run protection in a new isolated test DB.
// --snapshot <file>: save hashes only before setup; --baseline <file>: compare afterward.
import assert from "node:assert/strict";
import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { createHash, randomBytes } from "node:crypto";
import { MongoClient, ObjectId } from "mongodb";
import mongoose from "mongoose";
import nextEnv from "@next/env";
import ts from "typescript";
import { applySetup, finalFields, owners, plan } from "./setup-final-demo-data.mjs";

nextEnv.loadEnvConfig(process.cwd());
if (process.env.FINAL_DEMO_DNS) dns.setServers(process.env.FINAL_DEMO_DNS.split(","));
const require = createRequire(import.meta.url), cache = new Map();
let authenticatedUser;
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const loaded = { exports: {} };
  function localRequire(name) {
    if (name === "server-only") return {};
    // Authentication is supplied at the handler boundary; no sessions or passwords change.
    if (name === "@/lib/auth") return { getAuthenticatedUser: async () => authenticatedUser };
    if (name.startsWith("@/")) return load(name.slice(2) + ".ts");
    return require(name);
  }
  vm.runInThisContext("(function(require,module,exports){" + code + "\n})", { filename: file })(localRequire, loaded, loaded.exports);
  cache.set(file, loaded.exports);
  return loaded.exports;
}
function hash(value) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
async function unaffectedSnapshot(db) {
  const result = {};
  for (const { name } of await db.listCollections({}, { nameOnly: true }).toArray()) {
    if (name === "final_demo_setups" || name.startsWith("system.")) continue;
    const rows = await db.collection(name).find({}).sort({ _id: 1 }).toArray();
    // Hash every untouched field, including credential fields, without saving or printing them.
    for (const row of rows) {
      if (name === "opportunities" && plan.some(item => item.id === String(row._id))) {
        for (const field of [...Object.keys(finalFields(plan[0])), "updatedAt"]) delete row[field];
      }
      if (name === "users" && String(row._id) === owners[1].id) {
        for (const field of ["companyName", "companyDescription", "updatedAt"]) delete row[field];
      }
    }
    result[name] = { count: rows.length, sha256: hash(rows) };
  }
  return result;
}
async function verify(db) {
  const users = await db.collection("users").find({}, { projection: { role: 1, status: 1, fullName: 1, companyName: 1 } }).toArray();
  const rows = await db.collection("opportunities").find({}).toArray();
  for (const row of rows) {
    const owner = users.find(u => String(u._id) === String(row.createdBy));
    assert.ok(owner, "Every opportunity must have an existing owner.");
    if (row.status === "Published") {
      assert.equal(owner.role, "employee"); assert.equal(owner.status, "Active");
      assert.equal(owner.companyName, row.organisation);
      assert.match(row.closingDate, /^2026-12-\d{2}$/);
    }
  }
  const { OpportunityModel } = load("lib/models/Opportunity.ts");
  const { opportunityInputSchema } = load("lib/opportunity.ts");
  for (const item of plan) {
    const row = rows.find(r => String(r._id) === item.id);
    assert.ok(row); assert.equal(row.status, "Published");
    opportunityInputSchema.parse(row);
    await new OpportunityModel(row).validate();
    assert.ok(row.description.includes("does not submit an application"));
    assert.equal(String(row.createdBy), owners[item.owner].id);
  }
  // Exercise the real API GET and repository using actual database users.
  // Only the authentication boundary is substituted; this is not a browser login test.
  const handler = load("app/api/opportunities/route.ts");
  const student = users.find(u => u.role === "student" && u.status === "Active");
  assert.ok(student, "An Active Student is required for discovery verification.");
  authenticatedUser = { ...student, id: String(student._id) };
  const response = await handler.GET(); assert.equal(response.status, 200);
  const found = (await response.json()).data;
  assert.ok(plan.every(item => found.some(row => row.id === item.id)), "Student GET returns all six final opportunities.");
  for (const owner of owners) {
    authenticatedUser = { ...users.find(u => String(u._id) === owner.id), id: owner.id };
    const response = await handler.GET(); assert.equal(response.status, 200);
    const found = (await response.json()).data;
    assert.ok(found.every(row => row.createdBy === owner.id), "Employee sees only own opportunities.");
    assert.ok(plan.filter(item => owners[item.owner].id === owner.id).every(item => found.some(row => row.id === item.id)));
  }
  const decemberCounts = {};
  for (const date of ["2026-12-01", "2026-12-15", "2026-12-20", "2026-12-31"]) decemberCounts[date] = await db.collection("opportunities").countDocuments({ _id: { $in: plan.map(p => new ObjectId(p.id)) }, status: "Published", closingDate: { $gte: date } });
  console.log(JSON.stringify({ verified: true, finalOpportunities: plan.length, orphanCount: 0, activeEmployeeOwners: owners.length, studentGet: "passed", employeeGet: "passed for both owners", authenticationBoundary: "supplied real users; no browser login", decemberCounts }));
}
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
let isolated;
try {
  await client.connect();
  const target = client.db(process.env.MONGODB_DB || "internship_tracker");
  if (process.argv.includes("--snapshot")) {
    const file = process.argv[process.argv.indexOf("--snapshot") + 1];
    fs.writeFileSync(file, JSON.stringify(await unaffectedSnapshot(target), null, 2));
    console.log("Saved hashes of unaffected data; no raw user data or secrets saved.");
  } else if (process.argv.includes("--integration")) {
    isolated = "internship_tracker_test_final_" + randomBytes(4).toString("hex");
    process.env.MONGODB_DB = isolated;
    const db = client.db(isolated);
    const safeUsers = await target.collection("users").find({}, { projection: { fullName: 1, email: 1, role: 1, status: 1, companyName: 1 } }).toArray();
    await db.collection("users").insertMany(safeUsers);
    await db.collection("opportunities").insertMany(await target.collection("opportunities").find({}).toArray());
    await db.collection("unrelated_test").insertOne({ value: "must remain unchanged" });
    const before = await unaffectedSnapshot(db);
    const driftItem = plan[0];
    await db.collection("opportunities").updateOne({ _id: new ObjectId(driftItem.id) }, { $set: { role: "Concurrent change" } });
    await assert.rejects(() => applySetup(client, db));
    assert.equal(await db.collection("final_demo_setups").countDocuments({}), 0);
    assert.equal((await db.collection("users").findOne({ _id: new ObjectId(owners[1].id) })).companyName, "");
    await db.collection("opportunities").updateOne({ _id: new ObjectId(driftItem.id) }, { $set: { role: driftItem.previousRole } });
    await applySetup(client, db);
    assert.deepEqual(await unaffectedSnapshot(db), before);
    await verify(db);
    await db.collection("opportunities").updateOne({ _id: new ObjectId(plan[0].id) }, { $set: { description: "A later website edit must survive." } });
    await assert.rejects(() => applySetup(client, db));
    assert.equal((await db.collection("opportunities").findOne({ _id: new ObjectId(plan[0].id) })).description, "A later website edit must survive.");
    console.log("PASS isolated transaction, drift rejection, unchanged unrelated data, one-time guard and preservation of later edits.");
  } else {
    await verify(target);
    if (process.argv.includes("--baseline")) {
      const file = process.argv[process.argv.indexOf("--baseline") + 1];
      assert.deepEqual(await unaffectedSnapshot(target), JSON.parse(fs.readFileSync(file, "utf8")));
      console.log("PASS all unrelated collections, user credentials/roles/statuses and untouched fields match the pre-setup hashes.");
    }
  }
} catch (error) {
  console.error(`Verification failed (${error.name}, ${error.code || "assertion"}); credentials suppressed.`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
  if (isolated) {
    assert.match(isolated, /^internship_tracker_test_final_[a-f0-9]{8}$/);
    try {
      await client.db(isolated).dropDatabase();
      console.log("Removed only this run's isolated test database.");
    } catch {
      console.error("Isolated test database cleanup failed; credentials suppressed.");
      process.exitCode = 1;
    }
  }
  await client.close();
}
