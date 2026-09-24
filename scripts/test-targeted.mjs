// Run: node scripts/test-targeted.mjs [--integration] [--ui]
// Integration follows test-workflow.mjs: a unique internship_tracker_test_* database only.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import mongoose from "mongoose";
import nextEnv from "@next/env";

const require = createRequire(import.meta.url);
const cache = new Map();
const overrides = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const loadedModule = { exports: {} };
  const localRequire = name => {
    if (overrides.has(name)) return overrides.get(name);
    if (name === "server-only") return {};
    if (name.startsWith("@/")) {
      const target = name.slice(2);
      return load(fs.existsSync(target + ".ts") ? target + ".ts" : target + ".tsx");
    }
    return require(name);
  };
  vm.runInThisContext("(function(require,module,exports){" + code + "\n})", { filename: file })(localRequire, loadedModule, loadedModule.exports);
  cache.set(file, loadedModule.exports);
  return loadedModule.exports;
}
let count = 0;
function check(value, label) { assert.ok(value, label); count++; console.log("PASS " + label); }
const Overview = load("components/opportunities/RecruitmentOverview.tsx").default;
const listing = { organisation: "Targeted company", location: "Auckland", closingDate: "2099-12-31", status: "Draft", description: "Targeted regression listing description.", employmentType: "Internship", workMode: "Hybrid", applicationUrl: "" };
const dateValues = [new Date("2026-09-20"), "2026-09-23T00:00:00Z", undefined, "broken", new Date("invalid")];
for (const size of [0, 1, 2, 5]) {
  // Rotate to exercise each date representation even in one/two-row inputs.
  for (let offset = 0; offset < dateValues.length; offset++) {
    const rows = Array.from({ length: size }, (_, i) => ({ ...listing, id: String(i), role: "Listing " + i, updatedAt: dateValues[(i + offset) % dateValues.length] }));
    const html = renderToStaticMarkup(React.createElement(Overview, { name: "Employee", rows }));
    const ids = [...html.matchAll(/href="\/employee\/opportunities\/(\d+)"/g)].map(match => match[1]);
    const valid = rows.filter(row => row.updatedAt instanceof Date ? Number.isFinite(row.updatedAt.getTime()) : typeof row.updatedAt === "string" && Number.isFinite(Date.parse(row.updatedAt)));
    const expected = [...valid].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).concat(rows.filter(row => !valid.includes(row)));
    assert.deepEqual(ids, expected.map(row => row.id));
    check(rows.every((row, i) => row.id === String(i)), "Overview " + size + " rows, date rotation " + offset + ": renders, sorts newest first, preserves input and invalid-date order");
  }
}

async function integration() {
  nextEnv.loadEnvConfig(process.cwd());
  const dbName = "internship_tracker_test_t" + randomBytes(6).toString("hex");
  process.env.MONGODB_DB = dbName;
  const apps = load("lib/applicationsRepository.ts");
  const events = load("lib/eventsRepository.ts");
  const { ApplicationModel: App } = load("lib/models/Application.ts");
  const { CalendarEventModel: Event } = load("lib/models/CalendarEvent.ts");
  let server, browser, connected = false;
  try {
    await load("lib/mongodb.ts").connectToDatabase();
    connected = true;
    assert.equal(mongoose.connection.name, dbName);
    const db = mongoose.connection.db;
    const hello = await db.command({ hello: 1 });
    check(Boolean(hello.setName || hello.msg === "isdbgrid"), "isolated database supports transactions");
    await App.init(); await Event.init();
    const user = String(new mongoose.Types.ObjectId()), other = String(new mongoose.Types.ObjectId());
    const makeApp = (userId = user) => apps.createApplication(userId, { organisation: "Targeted", roleTitle: "Targeted application", deadline: "2099-12-31", status: "Interview" });
    const input = (applicationId, type = "interview") => ({ applicationId, type, title: "Targeted " + type, organisation: "Targeted", date: "2099-12-31", time: "12:00", location: "", notes: "" });
    const survivor = await makeApp();
    const survivorEvent = await events.createCalendarEvent(user, input(survivor.id));
    for (const types of [[], ["interview"], ["reminder"], ["interview", "reminder"], ["deadline"]]) {
      const app = await makeApp();
      const before = await App.findById(app.id).lean();
      for (const type of types) await events.createCalendarEvent(user, input(app.id.toUpperCase(), type));
      check((await App.findById(app.id).lean()).updatedAt.getTime() === before.updatedAt.getTime(), "event creation preserves application updatedAt");
      const foreign = await Event.create({ ...input(app.id), userId: other });
      check(await apps.deleteApplication(app.id, other) === null, "other user cannot delete application");
      check(Boolean(await apps.deleteApplication(app.id, user)), "delete application with " + (types.join("+") || "no events"));
      check(await Event.countDocuments({ userId: user, applicationId: app.id }) === 0, "associated events really removed from database");
      check(Boolean(await Event.findById(foreign._id)), "other user's event retained");
      check(Boolean(await Event.findById(survivorEvent.id)), "other application's event retained");
      check(await apps.deleteApplication(app.id, user) === null, "repeated delete returns not found");
      check(await events.createCalendarEvent(user, input(app.id)) === null, "creation after delete rejected");
    }
    const legacy = await makeApp();
    await Event.collection.insertOne({ ...input(legacy.id.toUpperCase()), userId: new mongoose.Types.ObjectId(user) });
    await apps.deleteApplication(legacy.id.toUpperCase(), user);
    check(await Event.countDocuments({ applicationId: legacy.id.toUpperCase(), userId: user }) === 0, "legacy uppercase reference cleaned");

    // Exercise the real DELETE handler with real database writes and a forced cleanup failure.
    const rollback = await makeApp();
    await events.createCalendarEvent(user, input(rollback.id));
    overrides.set("@/lib/authorization", { authorizeRole: async () => ({ authorized: true, user: { id: user } }) });
    const route = load("app/api/applications/[id]/route.ts");
    const originalDelete = Event.deleteMany;
    Event.deleteMany = async () => { throw new Error("Injected cleanup failure"); };
    try {
      const response = await route.DELETE(new Request("http://localhost/api/applications/" + rollback.id), { params: Promise.resolve({ id: rollback.id }) });
      check(response.status === 500 && !(await response.json()).success, "cleanup failure returns HTTP 500, never success");
      check(Boolean(await App.findById(rollback.id)) && await Event.countDocuments({ applicationId: rollback.id }) === 1, "cleanup failure rolls back parent deletion and preserves event");
    } finally { Event.deleteMany = originalDelete; }
    check(Boolean(await apps.deleteApplication(rollback.id, user)), "retry after cleanup failure succeeds");

    // Hold event creation after the parent write; deletion must conflict/retry.
    const racing = await makeApp();
    const originalCreate = Event.create;
    let release, signal;
    const entered = new Promise(resolve => { signal = resolve; });
    const gate = new Promise(resolve => { release = resolve; });
    Event.create = async function (...args) { signal(); await gate; return originalCreate.apply(this, args); };
    try {
      const creating = events.createCalendarEvent(user, input(racing.id));
      await entered;
      const deleting = apps.deleteApplication(racing.id, user);
      await new Promise(resolve => setTimeout(resolve, 100));
      release();
      await Promise.all([creating, deleting]);
      check(!await App.findById(racing.id) && await Event.countDocuments({ applicationId: racing.id }) === 0, "event creation holding parent lock interleaved with deletion leaves no orphan");
    } finally { release(); Event.create = originalCreate; }

    // The reverse ordering: deletion holds the parent write while creation starts.
    const deletingFirst = await makeApp();
    const deleteMany = Event.deleteMany;
    let releaseDelete, signalDelete;
    const deleteEntered = new Promise(resolve => { signalDelete = resolve; });
    const deleteGate = new Promise(resolve => { releaseDelete = resolve; });
    Event.deleteMany = async function (...args) { signalDelete(); await deleteGate; return deleteMany.apply(this, args); };
    try {
      const deleting = apps.deleteApplication(deletingFirst.id, user);
      await deleteEntered;
      const creating = events.createCalendarEvent(user, input(deletingFirst.id));
      await new Promise(resolve => setTimeout(resolve, 100));
      releaseDelete();
      const [, created] = await Promise.all([deleting, creating]);
      check(created === null && await Event.countDocuments({ applicationId: deletingFirst.id }) === 0, "deletion holding parent lock rejects interleaved event creation after retry");
    } finally { releaseDelete(); Event.deleteMany = deleteMany; }

    // Concurrent reassignment into a deleting application must not escape cleanup.
    for (let i = 0; i < 5; i++) {
      const target = await makeApp();
      const moving = await events.createCalendarEvent(user, input(survivor.id, "reminder"));
      await Promise.all([events.updateCalendarEvent(moving.id, user, input(target.id, "reminder")), apps.deleteApplication(target.id, user)]);
      check(await Event.countDocuments({ applicationId: target.id, userId: user }) === 0, "event reassignment/delete race " + i + " leaves no orphan");
    }
    const missing = String(new mongoose.Types.ObjectId());
    const foreignApp = await makeApp(other);
    const orphanIds = [];
    for (const applicationId of [missing, "invalid-id", foreignApp.id]) {
      const row = await Event.create({ ...input(applicationId), userId: user }); orphanIds.push(String(row._id));
    }
    const visible = await events.listCalendarEvents(user);
    check(orphanIds.every(id => !visible.some(row => row.id === id)), "read excludes missing, invalid and cross-owner application references");
    check(visible.some(row => row.id === survivorEvent.id), "read retains valid events");
    check(await events.createCalendarEvent(user, input("invalid-id")) === null && await events.createCalendarEvent(user, input(foreignApp.id)) === null, "invalid and foreign application event writes rejected");
    check(await events.updateCalendarEvent(survivorEvent.id, other, input(foreignApp.id)) === null, "event update ownership enforced");

    if (process.argv.includes("--ui")) {
      const employee = String(new mongoose.Types.ObjectId());
      const tokens = { student: randomBytes(32).toString("hex"), employee: randomBytes(32).toString("hex") };
      for (const [role, id] of [["student", user], ["employee", employee]]) {
        await db.collection("users").insertOne({ _id: new mongoose.Types.ObjectId(id), fullName: "Targeted " + role, email: role + "@targeted.test", role, status: "Active" });
        await db.collection("sessions").insertOne({ token: tokens[role], userId: new mongoose.Types.ObjectId(id), expiresAt: new Date(Date.now() + 3600000) });
      }
      const port = 3102, base = "http://localhost:" + port;
      server = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start", "--port", String(port)], { env: { ...process.env, MONGODB_DB: dbName, GEMINI_API_KEY: "" }, windowsHide: true, stdio: "ignore" });
      let ready = false;
      for (let i = 0; i < 80; i++) {
        try { if ((await fetch(base + "/login")).ok) { ready = true; break; } } catch { /* starting */ }
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      assert.ok(ready, "isolated UI server ready");
      const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright");
      browser = await chromium.launch({ channel: "chrome", headless: true });
      const errors = [];
      async function pageFor(role) {
        const context = await browser.newContext();
        await context.addCookies([{ name: "session_token", value: tokens[role], url: base }]);
        const page = await context.newPage(); page.on("pageerror", error => errors.push(error.message)); page.setDefaultTimeout(15000); return page;
      }
      const employeePage = await pageFor("employee");
      for (const size of [0, 1, 2, 5]) {
        while (await db.collection("opportunities").countDocuments({ createdBy: new mongoose.Types.ObjectId(employee) }) < size) {
          const response = await employeePage.request.post(base + "/api/opportunities", { data: { ...listing, role: "UI listing " + await db.collection("opportunities").countDocuments({}) } });
          assert.equal(response.status(), 201);
        }
        await employeePage.goto(base + "/employee/dashboard");
        await employeePage.getByRole("heading", { name: "Recent opportunities", exact: true }).waitFor();
        check(await employeePage.locator('a[href^="/employee/opportunities/"]').filter({ hasText: /UI listing/ }).count() === size, "UI Overview after creating " + size + " listings renders on re-entry");
      }
      const records = await db.collection("opportunities").find({ createdBy: new mongoose.Types.ObjectId(employee) }).toArray();
      for (let i = 0; i < records.length; i++) {
        await db.collection("opportunities").updateOne({ _id: records[i]._id }, i === 2 ? { $unset: { updatedAt: "" } } : { $set: { updatedAt: [new Date("2026-09-20"), "2026-09-23T00:00:00Z", null, "invalid", null][i] } });
      }
      await employeePage.reload();
      await employeePage.getByRole("heading", { name: "Recent opportunities" }).waitFor();
      const listingLinks = employeePage.locator('a[href^="/employee/opportunities/"]').filter({ hasText: /UI listing/ });
      check(await listingLinks.count() === 5 && (await listingLinks.first().getAttribute("href")).endsWith(String(records[1]._id)), "UI Overview handles mixed BSON Date, ISO, missing and invalid dates in correct order");

      const page = await pageFor("student");
      const removed = await makeApp();
      for (const type of ["interview", "reminder"]) await events.createCalendarEvent(user, input(removed.id, type));
      await page.goto(base + "/applications/" + removed.id);
      await page.getByRole("button", { name: "Delete", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Delete application", exact: true });
      await dialog.waitFor();
      check((await dialog.textContent()).includes("interviews and reminders"), "UI delete confirmation explains cascade");
      const deleted = page.waitForResponse(response => response.url().endsWith("/api/applications/" + removed.id) && response.request().method() === "DELETE");
      await dialog.getByRole("button", { name: "Delete application", exact: true }).click();
      check((await deleted).status() === 200, "UI application delete succeeds");
      check(await Event.countDocuments({ applicationId: removed.id, userId: user }) === 0, "UI delete removes both persisted event types");
      for (const route of ["/calendar", "/dashboard"]) {
        const response = page.waitForResponse(r => r.url().endsWith("/api/events") && r.request().method() === "GET");
        await page.goto(base + route); const body = await (await response).json();
        check(body.success && body.data.every(row => row.applicationId !== removed.id && !orphanIds.includes(row.id)), "UI " + route + " reload excludes deleted and old orphan events");
        await page.getByRole("heading", { name: route === "/calendar" ? "Calendar" : "Upcoming interviews", exact: true }).waitFor();
        check(await page.locator('a[href="/applications/' + removed.id + '"]').count() === 0, "UI " + route + " has no deleted application link");
      }
      check(errors.length === 0, "targeted UI scenarios have no browser runtime errors: " + errors.join("; "));
    }
  } finally {
    if (browser) await browser.close();
    if (server) server.kill();
    if (connected) {
      assert.ok(dbName.startsWith("internship_tracker_test_t") && mongoose.connection.name === dbName);
      await mongoose.connection.dropDatabase(); console.log("Isolated targeted test database removed.");
    }
    await mongoose.disconnect();
  }
}
if (process.argv.includes("--integration")) await integration();
console.log("SUCCESS " + count + " targeted assertions");
