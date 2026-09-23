import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

export async function testAIUI({ base, student, appId }) {
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addCookies([{ name: "session_token", value: student.slice(student.indexOf("=") + 1), url: base }]);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  let count = 0;
  const check = (value, message) => { assert.ok(value, message); count++; console.log("AI UI PASS " + message); };
  let mode = "success", release, aiRequests = 0;
  const output = {
    "interview-prep": { interviewQuestions: ["Explain a TypeScript project."], skillsToHighlight: ["TypeScript"], preparationTips: ["Prepare examples."], questionsForEmployer: ["How does mentoring work?"] },
    "application-insights": { strengths: ["Relevant coursework."], areasToPrepare: ["Verify missing requirements."], applicationTips: ["Tailor your evidence."], preparationChecklist: ["Review the listing."] },
  };
  try {
    await page.route("**/api/ai/*", async route => {
      aiRequests++;
      if (mode === "pending") await new Promise(resolve => { release = resolve; });
      const feature = route.request().url().split("/").pop();
      const body = mode === "invalid-response" ? { success: false, code: "AI_INVALID_RESPONSE", message: "AI could not return usable guidance. Please try again." } : mode === "denied" ? { success: false, code: "AI_PROVIDER_ACCESS_DENIED", message: "AI access is unavailable. Please contact the project administrator." } : mode === "rate-limit" ? { success: false, code: "AI_RATE_LIMIT", message: "Too many AI requests. Please try again in 30 seconds." } : mode === "quota" ? { success: false, code: "AI_PROVIDER_QUOTA", message: "AI is busy. Please try again shortly." } : mode === "error" ? { success: false, message: "AI is temporarily unavailable." } : mode === "invalid" ? { success: true, data: {} } : { success: true, data: output[feature] };
      await route.fulfill({ status: mode === "invalid-response" ? 502 : ["rate-limit", "quota"].includes(mode) ? 429 : ["error", "denied"].includes(mode) ? 503 : 200, json: body });
    });
    await page.goto(base + "/applications/" + appId);
    await page.getByRole("link", { name: "Prepare with AI", exact: true }).click();
    await page.getByLabel("Application", { exact: true }).waitFor();
    check(await page.getByLabel("Application", { exact: true }).inputValue() === appId, "detail link preselects its application");
    await page.getByLabel("Application", { exact: true }).selectOption("");
    check(await page.getByRole("button", { name: "Generate", exact: true }).isDisabled(), "selection required");
    await page.getByLabel("Application", { exact: true }).selectOption(appId);
    await page.clock.install();
    mode = "pending";
    await page.getByRole("button", { name: "Generate", exact: true }).click();
    await page.getByText("Preparing your personalised guidance…", { exact: true }).waitFor();
    check(await page.getByLabel("Application", { exact: true }).isDisabled(), "generation locks selection");
    check(await page.getByRole("button", { name: "Generating…", exact: true }).isDisabled(), "generation prevents double submission");
    check(aiRequests === 1, "first Generate sends exactly one request");
    while (!release) await new Promise(resolve => setTimeout(resolve, 10));
    await page.clock.fastForward(45000);
    check(await page.getByRole("button", { name: "Generating…", exact: true }).isDisabled(), "client remains pending within the 48-second server budget");
    mode = "success"; release();
    await page.getByRole("heading", { name: "Interview questions", exact: true }).waitFor();
    check(await page.getByRole("region", { name: "AI guidance" }).locator("article").count() === 4, "interview output has four sections");
    await page.getByRole("radio", { name: /Application Insights/ }).check();
    await page.getByRole("button", { name: "Generate", exact: true }).click();
    await page.getByRole("heading", { name: "Preparation checklist", exact: true }).waitFor();
    check(aiRequests === 2, "successful Interview can immediately generate Insights without refreshing");
    await page.getByRole("radio", { name: /Interview Preparation/ }).check();
    mode = "pending"; release = undefined;
    await page.getByRole("button", { name: "Generate", exact: true }).click();
    while (!release) await new Promise(resolve => setTimeout(resolve, 10));
    await page.clock.fastForward(55000);
    await page.getByText("The request timed out. Please try again.", { exact: true }).waitFor();
    check(await page.getByRole("button", { name: "Generate", exact: true }).isEnabled(), "55-second client timeout releases loading state");
    mode = "success"; release();
    await page.clock.resume();
    await page.getByRole("radio", { name: /Application Insights/ }).check();
    check(await page.getByRole("region", { name: "AI guidance" }).count() === 0, "feature switch clears stale output");
    await page.getByRole("button", { name: "Generate", exact: true }).click();
    await page.getByRole("heading", { name: "Preparation checklist", exact: true }).waitFor();
    check(await page.getByRole("region", { name: "AI guidance" }).locator("article").count() === 4, "insights output has four sections");
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `no overflow at ${width}px`);
    }
    mode = "error"; await page.getByRole("button", { name: "Generate", exact: true }).click();
    await page.locator('section[role="alert"]').waitFor();
    check((await page.locator('section[role="alert"]').textContent()).includes("temporarily unavailable"), "friendly provider error");
    for (const [nextMode, message] of [["invalid-response", "AI could not return usable guidance. Please try again."], ["rate-limit", "Too many AI requests. Please try again in 30 seconds."], ["quota", "AI is busy. Please try again shortly."], ["denied", "AI access is unavailable. Please contact the project administrator."]]) {
      mode = nextMode;
      await page.getByRole("button", { name: "Generate", exact: true }).click();
      await page.getByText(message, { exact: true }).waitFor();
      check(true, nextMode + " preserves the correct error message");
      mode = "success";
      await page.getByRole("button", { name: "Generate", exact: true }).click();
      await page.getByRole("heading", { name: "Preparation checklist", exact: true }).waitFor();
      check(await page.locator('section[role="alert"]').count() === 0, nextMode + " retry clears error and renders guidance");
    }
    mode = "invalid"; await page.getByRole("button", { name: "Generate", exact: true }).click();
    await page.getByText("AI returned an unexpected response. Please try again.").waitFor();
    check(await page.getByRole("region", { name: "AI guidance" }).count() === 0, "invalid output never renders results");
    mode = "success"; await page.getByRole("button", { name: "Generate", exact: true }).click();
    await page.getByRole("heading", { name: "Preparation checklist", exact: true }).waitFor();
    await page.goto(base + "/ai-assistant?applicationId=000000000000000000000000");
    await page.getByText("The linked application is not available. Please choose one of your applications.").waitFor();
    check(await page.getByLabel("Application", { exact: true }).inputValue() === "", "invalid deep link does not select an unrelated application");
    await page.route("**/api/applications", route => route.fulfill({ json: { success: true, data: [] } }));
    await page.reload(); await page.getByRole("heading", { name: "Start with an application" }).waitFor();
    check(await page.getByRole("link", { name: "Add an application", exact: true }).count() === 1, "empty applications state");
    await page.unroute("**/api/applications");
    await page.route("**/api/applications", route => route.fulfill({ status: 500, json: { success: false } }));
    await page.reload(); await page.locator('section[role="alert"]').waitFor();
    await page.unroute("**/api/applications");
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await page.getByLabel("Application", { exact: true }).waitFor();
    check(true, "application load error can retry");
    check(errors.length === 0, "no browser runtime errors");
    console.log(`SUCCESS ${count} AI browser assertions (mocked provider).`);
  } finally { await browser.close(); }
}
