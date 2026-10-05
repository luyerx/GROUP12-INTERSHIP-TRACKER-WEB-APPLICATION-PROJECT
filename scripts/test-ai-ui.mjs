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
  let historyEntries = [], deleteFailure = false;
  const output = {
    "interview-prep": { interviewQuestions: ["Explain a TypeScript project."], skillsToHighlight: ["TypeScript"], preparationTips: ["Prepare examples."], questionsForEmployer: ["How does mentoring work?"] },
    "application-summary": { roleSummary: "A saved role.", keyResponsibilities: ["Build software."], requiredSkills: ["TypeScript."], importantDetails: ["Check the listing."], deadlineSummary: "Not supplied.", preparationPriorities: ["Review the listing."], studentStrengths: ["Relevant coursework."], areasToPrepare: ["Verify missing requirements."] },
    "smart-search": { keywords: ["software"], location: "Auckland", closingPeriod: "this_month", workMode: null, roleType: "Internship" },
    "opportunity-recommendations": { recommendations: [{ opportunityId: "111111111111111111111111", reasons: ["Relevant coursework."], matchingSkills: ["TypeScript"], preparationAreas: ["Prepare examples."] }], overallAdvice: ["Verify the current listing."] },
    "document-assistant": { summary: "A relevant draft.", strengths: ["Clear focus."], missingOrWeakAreas: ["Add evidence."], wordingSuggestions: [{ original: "TypeScript", suggestion: "Describe your TypeScript project.", reason: "Provide evidence." }], roleAlignmentTips: ["Tailor examples."], finalChecklist: ["Review the draft."] },
  };
  try {
    await page.route("**/api/ai/history/*", route => { const id=route.request().url().split("/").pop(); return route.fulfill({json:{success:true,item:historyEntries.find(item=>item.id===id)}}); });
    await page.route("**/api/ai/*", async route => {
      const endpoint = route.request().url().split("/").pop();
      if (endpoint === "history") {
        if(route.request().method()==="DELETE") {
          if(deleteFailure)return route.fulfill({status:500,json:{success:false}});
          const input=route.request().postDataJSON();historyEntries=input.clearAll?[]:historyEntries.filter(item=>item.id!==input.id);
        }
        return route.fulfill({ json: { success: true, history: historyEntries } });
      }
      if (endpoint === "usage") return route.fulfill({ json: { success: true, usage: { used: 0, hardLimit: 30, remaining: 30, warning: false, reachedHardLimit: false } } });
      aiRequests++;
      if (mode === "pending") await new Promise(resolve => { release = resolve; });
      const feature = route.request().url().split("/").pop();
      const body = mode === "invalid-response" ? { success: false, code: "AI_INVALID_RESPONSE", message: "AI could not return usable guidance. Please try again." } : mode === "denied" ? { success: false, code: "AI_PROVIDER_ACCESS_DENIED", message: "AI access is unavailable. Please contact the project administrator." } : mode === "rate-limit" ? { success: false, code: "AI_RATE_LIMIT", message: "Too many AI requests. Please try again in 30 seconds." } : mode === "quota" ? { success: false, code: "AI_PROVIDER_QUOTA", message: "AI is busy. Please try again shortly." } : mode === "error" ? { success: false, message: "AI is temporarily unavailable." } : mode === "invalid" ? { success: true, data: {} } : { success: true, data: output[feature], opportunities: [{ opportunityId: "111111111111111111111111", role: "Software internship", organisation: "Example", location: "Auckland", closingDate: "2099-12-31", workMode: "Hybrid", employmentType: "Internship" }] };
      if(mode === "success") {
        const entry={id:String(aiRequests).padStart(24,"0"),feature:feature==="opportunity-recommendations"?"opportunity-recommendation":feature,applicationId:route.request().postDataJSON().applicationId,createdAt:new Date().toISOString(),result:output[feature]};
        historyEntries.unshift(entry);body.history=entry;
      }
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
    await page.getByText("Preparing interview guidance…", { exact: true }).waitFor();
    check(await page.getByLabel("Application", { exact: true }).isDisabled(), "generation locks selection");
    check(await page.getByRole("button", { name: "Generating…", exact: true }).isDisabled(), "generation prevents double submission");
    check(aiRequests === 1, "first Generate sends exactly one request");
    while (!release) await new Promise(resolve => setTimeout(resolve, 10));
    check(await page.getByText("This may take a few more seconds.", { exact: true }).count() === 0, "slow hint is absent initially");
    await page.clock.fastForward(5000);
    await page.getByText("This may take a few more seconds.", { exact: true }).waitFor();
    check(true, "slow hint appears after five seconds");
    await page.clock.fastForward(22000);
    check(await page.getByRole("button", { name: "Generating…", exact: true }).isDisabled(), "client remains pending within the 28-second server budget");
    mode = "success"; release();
    await page.getByRole("heading", { name: "Interview questions", exact: true }).waitFor();
    check(await page.getByText("This may take a few more seconds.", { exact: true }).count() === 0, "success clears slow hint");
    check(await page.getByRole("region", { name: "AI guidance" }).locator("article").count() === 4, "interview output has four sections");
    await page.getByRole("radio", { name: /Application Summary/ }).check();
    await page.getByRole("button", { name: "Generate", exact: true }).click();
    await page.getByRole("heading", { name: "Preparation Priorities", exact: true }).waitFor();
    check(aiRequests === 2, "successful Interview can immediately generate Summary without refreshing");
    await page.getByRole("radio", { name: /Interview Preparation/ }).check();
    mode = "pending"; release = undefined;
    await page.getByRole("button", { name: "Generate", exact: true }).click();
    while (!release) await new Promise(resolve => setTimeout(resolve, 10));
    await page.clock.fastForward(35000);
    await page.getByText("The request timed out. Please try again.", { exact: true }).waitFor();
    check(await page.getByRole("button", { name: "Generate", exact: true }).isEnabled(), "35-second client timeout releases loading state");
    check(await page.getByText("This may take a few more seconds.", { exact: true }).count() === 0, "timeout clears slow hint");
    mode = "success"; release();
    await page.clock.resume();
    await page.getByRole("radio", { name: /Application Summary/ }).check();
    check(await page.getByRole("region", { name: "AI guidance" }).count() === 0, "feature switch clears stale output");
    await page.getByRole("button", { name: "Generate", exact: true }).click();
    await page.getByRole("heading", { name: "Preparation Priorities", exact: true }).waitFor();
    check(await page.getByRole("region", { name: "AI guidance" }).locator("article").count() === 8, "summary output has eight sections");
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
      await page.getByRole("heading", { name: "Preparation Priorities", exact: true }).waitFor();
      check(await page.locator('section[role="alert"]').count() === 0, nextMode + " retry clears error and renders guidance");
    }
    mode = "invalid"; await page.getByRole("button", { name: "Generate", exact: true }).click();
    await page.getByText("AI returned an unexpected response. Please try again.").waitFor();
    check(await page.getByRole("region", { name: "AI guidance" }).count() === 0, "invalid output never renders results");
    mode = "success"; await page.getByRole("button", { name: "Generate", exact: true }).click();
    await page.getByRole("heading", { name: "Preparation Priorities", exact: true }).waitFor();
    await page.getByRole("radio", { name: /Opportunity Recommendations/ }).check();
    await page.getByRole("button", { name: "Generate", exact: true }).click();
    await page.getByRole("heading", { name: "Software internship", exact: true }).waitFor();
    check(await page.getByRole("link", { name: "View Opportunity", exact: true }).count() === 1, "recommendation renders real opportunity link");
    await page.getByRole("radio", { name: /Smart Opportunity Search/ }).check();
    await page.getByLabel("Describe the opportunity you want").fill("software internships in Auckland closing this month");
    await page.getByRole("button", { name: "Search with AI" }).click();
    await page.getByRole("heading", { name: "We understood your search as:" }).waitFor();
    check(await page.getByText("Closing period:", { exact: true }).count() === 1, "search displays interpreted filters");
    await page.getByRole("radio", { name: /Document Assistant/ }).check();
    check(await page.getByRole("button", { name: "Generate", exact: true }).isDisabled(), "short document cannot submit");
    await page.getByLabel("Paste your document text here").fill("I built a TypeScript application with accessible forms. I worked with classmates to clarify requirements and document our technical decisions.");
    for (const documentType of ["resume", "cover-letter"]) {
      await page.getByLabel("Document type", { exact: true }).selectOption(documentType);
      await page.getByRole("button", { name: "Generate", exact: true }).click();
      await page.getByRole("heading", { name: "Wording Suggestions", exact: true }).waitFor();
      check(await page.getByText("Original excerpt:", { exact: true }).count() === 1, documentType + " structured wording review");
    }
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Career Hub no overflow at " + width);
    }
    if (process.env.AI_UI_SCREENSHOT_DIR) {
      await page.screenshot({ path: process.env.AI_UI_SCREENSHOT_DIR + "/ai-hub-desktop.png", fullPage: true });
      await page.setViewportSize({width:390,height:844});
      await page.screenshot({ path: process.env.AI_UI_SCREENSHOT_DIR + "/ai-hub-mobile.png", fullPage: true });
    }
    await page.getByRole("link",{name:/Document Assistant/}).first().click();
    await page.waitForURL("**/ai-assistant/history/*");
    await page.getByText("Only guidance and short excerpts are saved.",{exact:false}).waitFor();
    await page.getByRole("heading",{name:"Wording Suggestions",exact:true}).waitFor();
    check(await page.getByText("Only guidance and short excerpts are saved.",{exact:false}).count()===1,"document history detail renders structured suggestions");
    await page.getByRole("link",{name:"Back to assistant"}).click();
    await page.getByRole("heading",{name:"Recent history"}).waitFor();
    deleteFailure=true;
    await page.getByRole("button",{name:"Delete Document Assistant"}).first().click();
    await page.getByText("History could not be deleted. Please try again.",{exact:true}).waitFor();
    check(await page.getByRole("link",{name:/Document Assistant/}).count()>0,"failed deletion keeps saved history visible");
    deleteFailure=false;
    await page.getByRole("button",{name:"Clear all",exact:true}).click();
    await page.getByText("No AI history matches this date range.",{exact:true}).waitFor();
    check(historyEntries.length===0,"clear history confirms server deletion");
    await page.getByRole("radio", { name: /Interview Preparation/ }).check();
    check(await page.evaluate(() => !localStorage.getItem("ai-assistant-history-v1")), "no shared browser history cache");
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
