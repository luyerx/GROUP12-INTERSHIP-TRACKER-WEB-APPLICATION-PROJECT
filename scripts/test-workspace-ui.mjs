import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
// Optional browser regression: RUN_UI_TESTS=1, with Playwright installed or PLAYWRIGHT_MODULE set.
export async function testWorkspaceUI({ base, student, employee, admin, superadmin, newAdmin, password, appId, seedLegacyResource }) {
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const errors = [];
  let count = 0;
  const check = (value, label) => { assert.ok(value, label); count++; console.log("UI PASS " + label); };
  const output = process.env.UI_SCREENSHOTS_DIR;
  if (output) await fs.mkdir(output, { recursive: true });
  async function session(cookie, timezoneId = "Pacific/Auckland") {
    const context = await browser.newContext({ timezoneId, viewport: { width: 1440, height: 1000 } });
    await context.addCookies([{ name: "session_token", value: cookie.slice(cookie.indexOf("=") + 1), url: base }]);
    const page = await context.newPage();
    page.on("pageerror", e => errors.push(e.message));
    page.setDefaultTimeout(12000);
    return page;
  }
  async function shot(page, name) { if (output) await page.screenshot({ path: path.join(output, name + ".png"), fullPage: true }); }
  async function noOverflow(page, label) { check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), label + " has no page overflow"); }
  try {
    const page = await session(student);
    // Exercise the snapshot notice and latest link; data persistence is covered by test-feature-freeze.
    const snapshot = (await (await page.request.get(base + "/api/applications/" + appId)).json()).data;
    const latestEndpoint = "**/api/opportunities/" + snapshot.opportunityId;
    await page.route(latestEndpoint, route => route.fulfill({ json: { success: true, data: {
      id: snapshot.opportunityId, organisation: snapshot.organisation, role: "Latest role", location: "Wellington", closingDate: "2099-12-31", status: "Published", description: "Latest employer description", employmentType: "Internship", workMode: "Hybrid", applicationUrl: "https://example.test", applicationId: appId,
    } } }));
    await page.goto(base + "/applications/" + appId);
    await page.getByRole("link", { name: "View latest opportunity", exact: true }).waitFor();
    check(await page.getByText(/Tracking snapshot: these job details/).count() === 1, "Application clearly labels tracking snapshot and AI source");
    await page.getByRole("link", { name: "View latest opportunity", exact: true }).click();
    await page.getByRole("heading", { name: "Latest role", exact: true }).waitFor();
    check(page.url().endsWith("/opportunities/" + snapshot.opportunityId), "latest link opens current opportunity detail");
    await page.unroute(latestEndpoint);
    // This workflow fixture is Closed: the actual API must hide the unavailable link.
    await page.goto(base + "/applications/" + appId);
    await page.getByText(/The latest opportunity is unavailable/).waitFor();
    check(await page.getByRole("link", { name: "View latest opportunity", exact: true }).count() === 0, "unavailable opportunity has no broken latest link; application still opens");
    await page.goto(base + "/applications");
    await page.locator(".tracker-table tbody tr").first().waitFor();
    const listCount = await page.locator(".tracker-table tbody tr").count();
    await page.getByRole("button", { name: "Board", exact: true }).click();
    await page.locator(".application-board").waitFor();
    check(await page.locator(".board-card").count() === listCount, "List and Board display the same records");
    await page.getByLabel("Search applications").fill("Changed external");
    check(await page.locator(".board-card").count() === 1, "Board respects search");
    await page.getByLabel("Search applications").fill("");
    await page.getByLabel("Filter applications by status").selectOption("Offer");
    check((await page.locator(".board-card").allTextContents()).every(text => text.includes("Offer")), "Board respects status filter");
    await page.getByLabel("Filter applications by status").selectOption("All");
    await shot(page, "applications-board-desktop");
    await page.setViewportSize({ width: 390, height: 844 });
    await noOverflow(page, "Mobile Board"); await shot(page, "applications-board-mobile");
    await page.getByRole("button", { name: "List", exact: true }).click();
    check(await page.locator(".tracker-table tbody tr").count() === listCount, "List retained after switching");
    await noOverflow(page, "Mobile List");
    await page.goto(base + "/profile");
    await page.getByRole("button", { name: "Edit profile", exact: true }).click();
    check(await page.locator('input[type="email"]').count() === 0, "Profile email remains read-only while editing");
    await page.getByLabel("Full name", { exact: true }).fill("UI Updated Student");
    await page.getByRole("textbox", { name: "Add skill", exact: true }).fill("TypeScript");
    await page.getByRole("button", { name: "Add skill", exact: true }).click();
    for (const name of ["Email notifications", "Deadline reminders", "Interview reminders"]) {
      const toggle = page.getByRole("switch", { name, exact: true });
      check(await toggle.getAttribute("aria-checked") === "true", name + " initially on");
      await toggle.click();
    }
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await page.getByText("Profile saved. Your career details are up to date.").waitFor();
    check(await page.getByRole("heading", { name: "UI Updated Student", exact: true }).count() === 1, "Profile sections save through original flow");
    await page.reload();
    await page.getByRole("heading", { name: "UI Updated Student", exact: true }).waitFor();
    for (const name of ["Email notifications", "Deadline reminders", "Interview reminders"]) {
      const toggle = page.getByRole("switch", { name, exact: true });
      await toggle.waitFor();
      check(await toggle.getAttribute("aria-checked") === "false", name + " remains off after reload");
    }
    const savedProfile = await (await page.request.get(base + "/api/auth/me")).json();
    check(Object.values(savedProfile.user.notifications).every(value => value === false), "all three UI preferences persisted in backend");
    await noOverflow(page, "Mobile Profile");
    await page.goto(base + "/applications/" + appId);
    await page.getByLabel("Application status").waitFor();
    for (const status of ["Interested", "Preparing", "Applied", "Interview", "Offer", "Rejected", "Withdrawn"]) {
      const updated = page.waitForResponse(r => r.url().endsWith("/status") && r.request().method() === "PATCH");
      await page.getByLabel("Application status").selectOption(status);
      check((await updated).ok(), status + " status update succeeds");
      const progress = page.locator("section").filter({ has: page.getByRole("heading", { name: "Application Progress", exact: true }) });
      await progress.getByText(status, { exact: true }).waitFor();
      check((await progress.textContent()).includes("not a record of past events"), status + " progress clarifies current-status semantics");
      check(!/sent to employer|Application submitted|Submitted on|Employer received/i.test(await progress.textContent()), status + " has no invented historical claims");
      check(await page.getByRole("heading", { name: "Application details", exact: true }).count() === 1, status + " retains detail modules");
    }

    await page.getByLabel("Application status").selectOption("Interview");
    await page.waitForFunction(() => !document.querySelector('[aria-label="Application status"]').disabled);
    await page.reload();
    check(await page.getByLabel("Application status").inputValue() === "Interview", "Application detail status persists");
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page.getByRole("dialog", { name: "Delete application", exact: true }).waitFor();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    check(await page.getByRole("dialog").count() === 0, "Extracted delete modal cancels safely");
    await noOverflow(page, "Mobile Application Detail");
    await page.goto(base + "/applications/" + appId + "/edit");
    await page.locator('#organisation').waitFor();
    check(await page.locator('#organisation').getAttribute('readonly') !== null, "Tracked employer fields remain read-only");
    await page.goto(base + "/calendar");
    await page.getByRole("button", { name: "Add event", exact: true }).click();
    await page.locator('#eventTitle').fill("UI regression interview");
    await page.locator('#eventDate').fill("2026-09-20");
    await page.route("**/api/events", route => route.request().method() === "POST" ? route.fulfill({ status: 500, json: { success: false, message: "Unable to save calendar event. Please retry." } }) : route.continue());
    await page.getByRole("button", { name: "Add event", exact: true }).last().click();
    await page.getByRole("alert").filter({ hasText: "Unable to save calendar event." }).waitFor();
    check(await page.locator('#eventTitle').inputValue() === "UI regression interview", "Calendar failed write retains input");
    check(await page.getByRole("button", { name: "Add event", exact: true }).last().isEnabled(), "Calendar failed write releases button");
    await page.unroute("**/api/events");
    await page.getByRole("button", { name: "Add event", exact: true }).last().click();
    await page.getByRole("dialog", { name: "Calendar event", exact: true }).waitFor({ state: "hidden" });
    await page.getByRole("button", { name: /interview:.*UI regression interview/ }).click();
    await page.getByRole("button", { name: "Edit event", exact: true }).click();
    await page.locator('#eventTitle').fill("UI edited interview");
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await page.getByRole("dialog", { name: "Calendar event", exact: true }).waitFor({ state: "hidden" });
    // Edit returns to the detail dialog with the saved event selected.
    if (!await page.getByRole("button", { name: "Delete event", exact: true }).count()) await page.getByRole("button", { name: /interview:.*UI edited interview/ }).click();
    await page.getByRole("button", { name: "Delete event", exact: true }).click();
    await page.getByRole("dialog", { name: "Delete event", exact: true }).getByRole("button", { name: "Delete event", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    check(await page.getByRole("button", { name: /interview:.*UI edited interview/ }).count() === 0, "Calendar create edit delete completes");
    await noOverflow(page, "Mobile Calendar");
    const adminPage = await session(admin);
    const resource = { title: "UI featured guide", category: "Career Planning", featured: true, url: "https://react.dev/learn", type: "Guide", description: "Browser regression resource", status: "Published" };
    const createdResource = await adminPage.request.post(base + "/api/admin/content?kind=resources", { data: resource });
    check(createdResource.ok(), "Admin creates resource with a valid public URL");
    for (const url of ["", "https://example.org/guide"]) {
      const invalid = await adminPage.request.post(base + "/api/admin/content?kind=resources", { data: { ...resource, url } });
      check(invalid.status() === 400, "Published resource rejects invalid URL: " + url);
    }
    // Historical invalid data must still render safely; never bypass validation in the app.
    await seedLegacyResource({ title: "UI unavailable template", category: "Templates", featured: false, url: "", type: "Guide", description: "Legacy browser fixture", status: "Published" });
    await page.goto(base + "/resources");
    await page.locator('.resource-row').first().waitFor();
    check(await page.locator('.resource-group').count() === 2, "Resources grouped by actual categories");
    check(await page.getByText("Resource link unavailable", { exact: true }).count() === 1, "Missing resource URL is unavailable");
    check(await page.getByRole("link", { name: /Open UI featured guide/ }).first().getAttribute('target') === '_blank', "Resource opens a new tab");
    await noOverflow(page, "Mobile Resources"); await shot(page, "resources-mobile");
    await page.setViewportSize({ width: 1440, height: 1000 }); await shot(page, "resources-desktop");
    await page.getByLabel("Filter by category").selectOption("Templates");
    check(await page.locator('.resource-row').count() === 1, "Resource category filter works");
    await adminPage.goto(base + "/admin/resources");
    const resourceRow = adminPage.getByRole("row").filter({ hasText: "UI unavailable template" });
    await resourceRow.getByRole("button", { name: "Edit", exact: true }).click();
    const resourceDialog = adminPage.getByRole("dialog", { name: "Edit resource", exact: true });
    await resourceDialog.locator('input[name="title"]').fill("Retained title after failure");
    await resourceDialog.locator('input[name="url"]').fill("https://www.auckland.ac.nz");
    await adminPage.route("**/api/admin/content/*?kind=resources", route => route.request().method() === "PUT" ? route.fulfill({ status: 500, json: { success: false, message: "Unable to update content. Please retry." } }) : route.continue());
    await resourceDialog.getByRole("button", { name: "Save changes", exact: true }).click();
    await resourceDialog.getByRole("alert").waitFor();
    check(await resourceDialog.locator('input[name="title"]').inputValue() === "Retained title after failure", "Admin failed write retains modal input");
    check(await resourceDialog.getByRole("button", { name: "Save changes", exact: true }).isEnabled(), "Admin failed write allows retry");
    await adminPage.unroute("**/api/admin/content/*?kind=resources");
    adminPage.once("dialog", dialog => dialog.accept());
    const deletedResponse = adminPage.waitForResponse(response => response.url().includes("/api/admin/content/") && response.request().method() === "DELETE");
    await adminPage.getByRole("dialog", { name: "Edit resource", exact: true }).getByRole("button", { name: "Delete", exact: true }).click();
    check((await deletedResponse).status() === 200, "Admin Resource DELETE succeeds from UI");
    await resourceRow.waitFor({ state: "hidden" });
    check(await adminPage.getByRole("row").filter({ hasText: "UI featured guide" }).count() === 1, "Delete refreshes table and retains other resources");
    await adminPage.reload();
    await adminPage.getByRole("row").filter({ hasText: "UI featured guide" }).waitFor();
    check(await resourceRow.count() === 0, "Deleted resource remains absent after reload");
    await adminPage.goto(base + "/admin/users");
    await adminPage.getByRole("button", { name: "Manage Workflow employee", exact: true }).click();
    check(await adminPage.locator('select[name="role"]').count() === 0, "Ordinary Admin sees role badge only");
    await adminPage.getByRole("button", { name: "Cancel", exact: true }).click();
    check(await adminPage.getByRole("button", { name: "Manage Workflow Admin", exact: true }).isDisabled(), "Admin account controls protected");
    await shot(adminPage, "admin-users");
    const superPage = await session(superadmin);
    const directoryResponse = superPage.waitForResponse(response => response.url().endsWith("/api/admin/users") && response.request().method() === "GET");
    await superPage.goto(base + "/admin/users");
    check((await directoryResponse).status() === 200, "Super Admin Users API loads successfully");
    await superPage.getByRole("button", { name: "Manage Workflow employee", exact: true }).waitFor();
    check(await superPage.getByText("You do not have permission to perform this action.", { exact: true }).count() === 0, "Super Admin Users renders records without permission error");
    await superPage.getByRole("button", { name: "Manage Workflow employee", exact: true }).click();
    check(await superPage.locator('select[name="role"] option').allTextContents().then(a => a.join(',')) === "Student,Employee,Admin", "Super Admin selector excludes Super Admin creation");
    await superPage.locator('select[name="role"]').selectOption({ label: "Student" });
    await superPage.getByRole("button", { name: "Save changes", exact: true }).click();
    await superPage.getByText("User account updated.", { exact: true }).waitFor();
    await superPage.getByRole("button", { name: "Manage Workflow employee", exact: true }).click();
    check(await superPage.locator('select[name="role"]').inputValue() === "Student", "Role selector saves to server");
    await superPage.locator('select[name="role"]').selectOption({ label: "Employee" });
    await superPage.getByRole("button", { name: "Save changes", exact: true }).click();
    await superPage.getByText("User account updated.", { exact: true }).waitFor();
    check(await superPage.getByRole("button", { name: "Manage Workflow Super Admin", exact: true }).isDisabled(), "Super Admin self role status delete controls protected");
    await shot(superPage, "superadmin-users");
    check(await adminPage.getByRole("button", { name: "Add Admin", exact: true }).count() === 0, "Ordinary Admin cannot see Add Admin");
    const createdAdminPage = await session(newAdmin);
    await createdAdminPage.goto(base + "/admin/users");
    await createdAdminPage.getByRole("button", { name: "Manage Created Admin", exact: true }).waitFor();
    check(await createdAdminPage.getByRole("button", { name: "Add Admin", exact: true }).count() === 0, "New Admin cannot see Add Admin");
    check(await superPage.getByRole("button", { name: "Add Admin", exact: true }).isVisible(), "Super Admin sees Add Admin");
    await superPage.getByRole("button", { name: "Add Admin", exact: true }).click();
    let dialog = superPage.getByRole("dialog", { name: "Add Admin", exact: true });
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    check(await dialog.count() === 0, "Add Admin cancels without creation");
    await superPage.getByLabel("Search users").fill("no matching user");
    await superPage.getByRole("button", { name: "Add Admin", exact: true }).click();
    await superPage.setViewportSize({ width: 390, height: 844 });
    await dialog.getByLabel("Full Name", { exact: true }).fill("UI Created Admin");
    await dialog.getByLabel("Email", { exact: true }).fill("ui-created-admin@example.test");
    await dialog.getByLabel("Temporary Password", { exact: true }).fill(password);
    check(await dialog.locator('select').count() === 0, "Create Admin has no role selector");
    await noOverflow(superPage, "Mobile Add Admin dialog");
    // Hold the real request to verify disabled controls and close protection.
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await superPage.route("**/api/admin/users", async route => { if (route.request().method() === "POST") await gate; await route.continue(); });
    await dialog.getByLabel("Temporary Password", { exact: true }).press("Enter");
    await dialog.getByRole("button", { name: "Creating…", exact: true }).waitFor();
    check(await dialog.getByRole("button", { name: "Creating…", exact: true }).isDisabled(), "Create submission disables button");
    check(await dialog.getByLabel("Email", { exact: true }).isDisabled(), "Create submission disables fields");
    await superPage.keyboard.press("Escape");
    check(await dialog.isVisible(), "Busy modal stays open");
    release();
    await superPage.getByText("Admin account created successfully.", { exact: true }).waitFor();
    check(await dialog.count() === 0, "Successful create closes modal");
    await superPage.getByRole("button", { name: "Manage UI Created Admin", exact: true }).waitFor();
    check(await superPage.getByLabel("Search users").inputValue() === "", "Creation clears filters to show new admin immediately");
    await noOverflow(superPage, "Mobile Users after creation");
    await superPage.unroute("**/api/admin/users");
    await superPage.getByRole("button", { name: "Add Admin", exact: true }).click();
    await dialog.getByLabel("Full Name", { exact: true }).fill("Duplicate Admin");
    await dialog.getByLabel("Email", { exact: true }).fill("UI-CREATED-ADMIN@example.test");
    await dialog.getByLabel("Temporary Password", { exact: true }).fill(password);
    await dialog.getByRole("button", { name: "Create Admin", exact: true }).click();
    await dialog.getByRole("alert").filter({ hasText: "An account with this email already exists." }).waitFor();
    check(await dialog.isVisible(), "Duplicate error keeps modal open for correction");
    check(await dialog.getByRole("button", { name: "Create Admin", exact: true }).isEnabled(), "Duplicate error allows retry");
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await superPage.setViewportSize({ width: 1440, height: 1000 });
    const employeePage = await session(employee);
    for (const route of ["/employee/dashboard", "/employee/opportunities", "/employee/opportunities/new", "/employee/profile"]) {
      await employeePage.goto(base + route); await employeePage.locator('h1').waitFor();
      check(employeePage.url().endsWith(route), "Employee page accessible: " + route);
    }
    for (const route of ["/admin/dashboard", "/admin/opportunities", "/admin/resources"]) {
      await superPage.goto(base + route); await superPage.locator('h1').waitFor();
      check(superPage.url().endsWith(route), "Super Admin page accessible: " + route);
    }
    for (const manager of [adminPage, superPage]) {
      await manager.goto(base + "/admin/opportunities");
      await manager.getByRole("heading", { name: "Opportunities", exact: true }).waitFor();
      check(await manager.getByRole("link", { name: "Create Opportunity", exact: true }).count() === 0, "Admin has no creation entry");
      await manager.goto(base + "/admin/opportunities/new");
      await manager.waitForURL(base + "/admin/opportunities");
      check(await manager.getByText(/Review and manage existing Employee listings/).count() === 1, "Admin direct new URL returns to management");
    }
    for (const timezone of ["Pacific/Auckland", "America/Los_Angeles"]) {
      const datesPage = await session(student, timezone);
      for (const [now, today, tomorrow] of [
        ["2026-09-25T12:01:00Z", "2026-09-26", "2026-09-27"],
        ["2026-04-04T14:01:00Z", "2026-04-05", "2026-04-06"],
        ["2026-09-26T14:01:00Z", "2026-09-27", "2026-09-28"],
      ]) {
        // Hydrate with the real server clock, then exercise simulated dates via client navigation.
        // Freezing only the browser before SSR causes an artificial date-text hydration mismatch.
        await datesPage.goto(base + "/profile");
        await datesPage.getByRole("heading", { level: 1 }).waitFor();
        await datesPage.clock.setFixedTime(new Date(now));
        await datesPage.route("**/api/applications", route => route.fulfill({ json: { success: true, data: [
          { id: "today", organisation: "Today Company", roleTitle: "Today role", status: "Preparing", deadline: today },
          { id: "tomorrow", organisation: "Tomorrow Company", roleTitle: "Tomorrow role", status: "Preparing", deadline: tomorrow },
        ] } }));
        await datesPage.route("**/api/events", route => route.fulfill({ json: { success: true, data: [
          { id: "later", type: "interview", title: "Later interview", date: today, time: "15:00", applicationId: appId },
          { id: "early", type: "interview", title: "Early interview", date: today, time: "09:00", applicationId: appId },
          { id: "past", type: "interview", title: "Past interview", date: "2026-01-01", time: "09:00", applicationId: appId },
        ] } }));
        await datesPage.getByRole("link", { name: "Overview", exact: true }).click();
        const tasks = datesPage.locator('section').filter({ has: datesPage.getByRole('heading', { name: 'Upcoming tasks', exact: true }) });
        await tasks.getByText("Due today", { exact: true }).waitFor();
        check(await tasks.getByText("Due tomorrow", { exact: true }).count() === 1, timezone + " Auckland today/tomorrow agrees across midnight and DST");
        await datesPage.getByText("Early interview", { exact: true }).waitFor();
        check(await datesPage.getByText("Past interview", { exact: true }).count() === 0, timezone + " excludes past interviews");
        const interviews = datesPage.locator('section').filter({ has: datesPage.getByRole('heading', { name: 'Upcoming interviews', exact: true }) });
        check((await interviews.locator('a').allTextContents()).join('|').indexOf('Early interview') < (await interviews.locator('a').allTextContents()).join('|').indexOf('Later interview'), "same-day interviews sorted by HH:mm");
        await datesPage.unroute("**/api/applications"); await datesPage.unroute("**/api/events");
      }
      await datesPage.context().close();
    }
    await page.goto(base + "/admin/users"); check(page.url().endsWith('/dashboard'), "Student admin route denied");
    await employeePage.goto(base + "/admin/users"); check(employeePage.url().endsWith('/employee/dashboard'), "Employee admin route denied");
    await superPage.goto(base + "/profile"); check(superPage.url().endsWith('/admin/dashboard'), "Super Admin redirected from student workspace");
    check(errors.length === 0, "No browser runtime errors: " + errors.join('; '));
    console.log("SUCCESS " + count + " browser assertions");
  } finally { await browser.close(); }
}

