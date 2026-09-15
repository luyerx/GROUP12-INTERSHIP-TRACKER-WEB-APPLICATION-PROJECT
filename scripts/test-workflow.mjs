// Integration test uses an isolated database and never drops or changes the configured application database.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createHash, randomBytes } from "node:crypto";
const require = createRequire(import.meta.url);
import { spawn } from "node:child_process";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
const dbName = "internship_tracker_test_" + Date.now();
const port = 3101,
  base = "http://localhost:" + port;
const password = "Test-only-" + randomBytes(12).toString("hex");
let server, client;
let assertions = 0;
function check(value, message) {
  assert.ok(value, message);
  assertions++;
  console.log("PASS " + message);
}
async function request(url, method = "GET", body, cookie) {
  const r = await fetch(base + url, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try {
    data = await r.json();
  } catch {
    data = {};
  }
  return {
    status: r.status,
    data,
    cookie: r.headers.get("set-cookie")?.split(";")[0],
  };
}
async function login(email) {
  const r = await request("/api/auth/login", "POST", { email, password });
  check(r.status === 200, "login " + email.split("@")[0]);
  return r.cookie;
}
async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI required");
  client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  await client.connect();
  const db = client.db(dbName);
  await db
    .collection("users")
    .insertOne({
      fullName: "Workflow Admin",
      email: "admin@example.test",
      role: "admin",
      status: "Active",
      passwordHash: await bcrypt.hash(password, 10),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  server = spawn(
    process.execPath,
    [require.resolve("next/dist/bin/next"), "start", "--port", String(port)],
    {
      cwd: process.cwd(),
      env: { ...process.env, MONGODB_DB: dbName },
      windowsHide: true,
      stdio: "ignore",
    },
  );
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(base + "/login");
      if (r.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  check(
    (await request("/api/opportunities")).status === 401,
    "anonymous opportunities denied",
  );
  check(
    (
      await request("/api/auth/register", "POST", {
        fullName: "Blocked Admin",
        email: "blocked@example.test",
        password,
        role: "admin",
      })
    ).status === 403,
    "public admin registration denied",
  );
  for (const [email, role] of [
    ["student@example.test", "student"],
    ["other@example.test", "student"],
    ["employee@example.test", "employee"],
    ["outsider@example.test", "employee"],
  ]) {
    const r = await request("/api/auth/register", "POST", {
      fullName: "Workflow " + role,
      email,
      password,
      role,
    });
    check(r.status === 201, "register " + email.split("@")[0]);
  }
  const student = await login("student@example.test"),
    other = await login("other@example.test"),
    employee = await login("employee@example.test"),
    outsider = await login("outsider@example.test"),
    admin = await login("admin@example.test");
  check(
    (await request("/api/auth/me", "GET", undefined, employee)).data.user
      .role === "employee",
    "employee identity preserved",
  );
  check(
    (await request("/api/applications", "GET", undefined, employee)).status ===
      403,
    "employee cannot read student applications",
  );
  check(
    (await request("/api/admin/users", "GET", undefined, student)).status ===
      403,
    "student cannot administer users",
  );
  check(
    (
      await request(
        "/api/employee/profile",
        "PATCH",
        {
          fullName: "Workflow Employee",
          companyName: "Workflow Test Company",
          companyWebsite: "https://example.com",
          companyDescription: "Temporary integration test",
          location: "Auckland",
        },
        employee,
      )
    ).status === 200,
    "employee company profile saves",
  );
  const listing = {
    organisation: "Workflow Test Company",
    role: "Intern",
    location: "Auckland",
    closingDate: "2099-12-31",
    status: "Draft",
    description:
      "Work with our team on software projects. Apply through the company website.",
    employmentType: "Internship",
    workMode: "Hybrid",
    applicationUrl: "https://example.com/careers",
  };
  check(
    (await request("/api/opportunities", "POST", listing, student)).status ===
      403,
    "student publishing denied",
  );
  const created = await request(
    "/api/opportunities",
    "POST",
    listing,
    employee,
  );
  check(created.status === 201, "employee creates draft");
  const id = created.data.data.id;
  check(
    !(
      await request("/api/opportunities", "GET", undefined, student)
    ).data.data.some((r) => r.id === id),
    "draft hidden from discovery",
  );
  check(
    (await request("/api/opportunities/" + id, "GET", undefined, student))
      .status === 404,
    "draft direct URL protected",
  );
  check(
    (
      await request(
        "/api/opportunities/" + id,
        "PATCH",
        { ...listing, status: "Published" },
        outsider,
      )
    ).status === 404,
    "other employee cannot edit listing",
  );
  check(
    (
      await request(
        "/api/opportunities/" + id,
        "PATCH",
        {
          ...listing,
          status: "Published",
          applicationUrl: "javascript:alert(1)",
        },
        employee,
      )
    ).status === 400,
    "unsafe external URL rejected",
  );
  check(
    (
      await request(
        "/api/opportunities/" + id,
        "PATCH",
        { ...listing, status: "Published" },
        employee,
      )
    ).status === 200,
    "owner publishes listing",
  );
  check(
    (
      await request("/api/opportunities", "GET", undefined, student)
    ).data.data.some((r) => r.id === id),
    "published listing visible to student",
  );
  const tracked = await Promise.all(
    Array.from({ length: 3 }, () =>
      request(
        "/api/opportunities/" + id + "/track",
        "POST",
        undefined,
        student,
      ),
    ),
  );
  check(
    tracked.every((r) => r.status === 200 || r.status === 201),
    "concurrent tracking succeeds",
  );
  const appId = tracked[0].data.data.id;
  check(
    new Set(tracked.map((r) => r.data.data.id)).size === 1,
    "concurrent tracking returns same application",
  );
  check(
    (await db
      .collection("applications")
      .countDocuments({
        opportunityId: new ObjectId(created.data.data.id),
      })) === 1,
    "opportunity reference stored as ObjectId",
  );
  check(
    (await request("/api/applications", "GET", undefined, student)).data.data
      .length === 1,
    "only one application persisted",
  );
  check(
    (await request("/api/applications/" + appId, "GET", undefined, other))
      .status === 404,
    "student application ownership enforced",
  );
  for (const status of [
    "Interested",
    "Preparing",
    "Applied",
    "Interview",
    "Offer",
    "Rejected",
    "Withdrawn",
  ])
    check(
      (
        await request(
          "/api/applications/" + appId + "/status",
          "PATCH",
          { status },
          student,
        )
      ).status === 200,
      "pipeline " + status,
    );
  check(
    (
      await request(
        "/api/applications",
        "POST",
        {
          organisation: "External",
          roleTitle: "External Intern",
          sourceLink: "https://example.com",
        },
        student,
      )
    ).status === 201,
    "external application creation remains available",
  );
  check(
    (
      await request(
        "/api/opportunities/" + id,
        "PATCH",
        { ...listing, status: "Closed" },
        admin,
      )
    ).status === 200,
    "admin can manage employee listing",
  );
  check(
    (
      await request(
        "/api/opportunities/" + id + "/track",
        "POST",
        undefined,
        other,
      )
    ).status === 409,
    "closed listing cannot be newly tracked",
  );
  check(
    (await request("/api/applications/" + appId, "GET", undefined, student))
      .status === 200,
    "existing application retained after closure",
  );
  const users = await request("/api/admin/users", "GET", undefined, admin);
  check(
    new Set(users.data.data.map((r) => r.role)).size === 3,
    "admin user directory includes three roles",
  );
  const employeeUser = users.data.data.find(
    (r) => r.email === "employee@example.test",
  );
  check(
    (
      await request(
        "/api/admin/users/" + employeeUser.id,
        "PATCH",
        { programme: "", role: "Employee", status: "Suspended" },
        admin,
      )
    ).status === 200,
    "admin can suspend employee",
  );
  check(
    (await request("/api/opportunities", "GET", undefined, employee)).status ===
      401,
    "suspension revokes active session access",
  );
  check(
    (await request("/api/admin/stats", "GET", undefined, admin)).data.data
      .employees === 2,
    "admin role counts use real records",
  );

  const trackedApp = (await request("/api/applications/" + appId, "GET", undefined, student)).data.data;
  check((await request("/api/applications/" + appId, "PUT", { ...trackedApp, notes: "Personal note" }, student)).status === 200, "tracked application unchanged deadline and personal notes save");
  for (const field of ["organisation", "roleTitle", "location", "jobDescription", "deadline", "sourceLink"]) {
    const value = field === "deadline" ? "2099-10-01" : field === "sourceLink" ? "https://example.com/changed" : "Changed";
    check((await request("/api/applications/" + appId, "PUT", { ...trackedApp, [field]: value }, student)).status === 403, "tracked official field protected: " + field);
  }
  const external = await request("/api/applications", "POST", { organisation: "External", roleTitle: "Intern", deadline: "2026-09-20" }, student);
  check(external.status === 201, "external application valid date saves");
  check((await request("/api/applications/" + external.data.data.id, "PUT", { ...external.data.data, organisation: "Changed external", deadline: "2026-09-21" }, student)).status === 200, "external official details remain editable");
  const eventInput = { applicationId: appId, organisation: trackedApp.organisation, type: "interview", title: "Test interview", date: "2026-09-20" };
  check((await request("/api/events", "POST", { ...eventInput, date: "2026-02-30" }, student)).status === 400, "calendar invalid date rejected");
  const event = await request("/api/events", "POST", eventInput, student);
  check(event.status === 201, "calendar create after invalid date succeeds");
  const eventId = event.data.data.id;
  check((await request("/api/events/" + eventId, "PUT", { ...eventInput, date: "2026-09-21", type: "reminder" }, student)).status === 200, "calendar edit succeeds");
  check((await request("/api/events/" + eventId, "DELETE", undefined, other)).status === 404, "calendar delete ownership enforced");
  check((await request("/api/events/" + eventId, "DELETE", undefined, student)).status === 200, "calendar delete succeeds");
  check(!(await request("/api/events", "GET", undefined, student)).data.data.some(row => row.id === eventId), "deleted calendar event absent");
  const profile = { fullName: "Updated Student", email: "student@example.test", university: "Test University", degree: "", major: "", graduationYear: "", location: "", preferredRoles: [], preferredLocations: [], skills: [], openToInternships: true, emailNotifications: true, deadlineReminders: true, interviewReminders: true };
  check((await request("/api/profile", "PATCH", { ...profile, email: "changed@example.test" }, student)).status === 403, "profile email change rejected");
  check((await request("/api/profile", "PATCH", profile, student)).status === 200, "other profile fields save");
  const adminRow = await db.collection("users").findOne({ email: "admin@example.test" });
  check((await request("/api/admin/users/" + adminRow._id, "DELETE", undefined, admin)).status === 400, "admin self delete denied");
  const secondAdmin = await db.collection("users").insertOne({ fullName: "Second Admin", email: "second-admin@example.test", role: "admin", status: "Active", passwordHash: await bcrypt.hash(password, 10) });
  check((await request("/api/admin/users/" + secondAdmin.insertedId, "DELETE", undefined, admin)).status === 403, "other admin delete denied");
  check(await db.collection("users").findOne({ _id: secondAdmin.insertedId }), "protected admin retained");
  const studentRow = await db.collection("users").findOne({ email: "student@example.test" });
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await db.collection("passwordresettokens").insertOne({ userId: studentRow._id, tokenHash, expiresAt: new Date(Date.now() + 600000) });
  const same = await request("/api/auth/reset-password", "POST", { token, password });
  check(same.status === 400 && same.data.message.includes("same as your current password"), "reset rejects current password");
  check(await db.collection("passwordresettokens").findOne({ tokenHash }), "rejected reset preserves token for retry");
  const newPassword = password + "-new";
  check((await request("/api/auth/reset-password", "POST", { token, password: newPassword })).status === 200, "reset with different password succeeds");
  check((await request("/api/auth/me", "GET", undefined, student)).status === 401, "successful reset revokes old session");
  check((await request("/api/auth/login", "POST", { email: "student@example.test", password: newPassword })).status === 200, "new password login succeeds");
  check((await request("/api/auth/reset-password", "POST", { token, password })).status === 400, "consumed reset token rejected");
  console.log("SUCCESS " + assertions + " assertions");
}
main()
  .catch((e) => {
    console.error("FAILED", e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (server) server.kill();
    if (client) {
      if (dbName.startsWith("internship_tracker_test_"))
        await client.db(dbName).dropDatabase();
      await client.close();
      console.log("Isolated test database removed.");
    }
  });
