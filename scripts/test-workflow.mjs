// Integration test uses an isolated database and never drops or changes the configured application database.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";
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
