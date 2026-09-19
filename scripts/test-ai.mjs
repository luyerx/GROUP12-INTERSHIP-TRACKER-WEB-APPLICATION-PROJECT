// Executes the real route, authorization, ownership query and provider parser with isolated mocks.
// No database, API key or paid request is needed.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
const cache = new Map();
const testEnv = {};
const id = "111111111111111111111111";
const other = "222222222222222222222222";
let user = null, owner = "student-1", providerCalls = 0, providerMode = "success", lastRequest;
let now = 0, releaseProvider;
const providerTimeouts = [];
const diagnostics = [];
const TestAbortSignal = { timeout(ms) { providerTimeouts.push(ms); return AbortSignal.timeout(ms); } };
class TestDate extends Date { static now() { return now; } }
const profile = { id: owner, role: "student", skills: ["TypeScript"], degree: "BSc", major: "Computing", preferredRoles: ["Developer"], preferredLocations: [], email: "private@example.test" };
const application = { _id: id, userId: owner, organisation: "Example", roleTitle: "Intern", status: "Applied", jobDescription: "Build web apps. " + "x".repeat(20000), notes: "PRIVATE NOTES", createdAt: new Date(), updatedAt: new Date() };
const output = {
  "interview-prep": { interviewQuestions: ["Explain a TypeScript project."], skillsToHighlight: ["TypeScript"], preparationTips: ["Prepare an example."], questionsForEmployer: ["How is mentoring organised?"] },
  "application-insights": { strengths: ["TypeScript is listed."], areasToPrepare: ["Verify missing requirements."], applicationTips: ["Describe a project."], preparationChecklist: ["Review the job listing."] },
};
const mockFetch = async (_url, options) => {
  providerCalls++; lastRequest = JSON.parse(options.body);
  assert.equal(lastRequest.generationConfig.responseFormat.text.mimeType, "APPLICATION_JSON", "REST requires the MIME enum, not the SDK MIME string");
  assert.equal(lastRequest.generationConfig.thinkingConfig.thinkingLevel, "low");
  if (providerMode === "pending") await new Promise(resolve => { releaseProvider = resolve; });
  if (providerMode === "timeout") throw new DOMException("secret", "TimeoutError");
  if (providerMode === "network") throw new Error("secret provider stack");
  if (providerMode === "quota") return new Response("secret", { status: 429 });
  if (providerMode === "failure") return new Response("secret", { status: 403 });
  if (providerMode === "invalid-envelope") return new Response("not JSON");
  const feature = JSON.parse(lastRequest.contents[0].parts[0].text).feature;
  const text = providerMode === "invalid" ? "not JSON" : providerMode === "shape" ? JSON.stringify({ strengths: ["wrong"] }) : providerMode === "extra" ? JSON.stringify({ ...output[feature], match: 99 }) : JSON.stringify(output[feature]);
  if (providerMode === "blocked") return Response.json({ promptFeedback: { blockReason: "SAFETY" } });
  if (providerMode === "no-candidates") return Response.json({ candidates: [] });
  if (providerMode === "null-envelope") return Response.json(null);
  if (providerMode === "null-part") return Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [null] } }] });
  if (providerMode === "numeric-text") return Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: 42 }] } }] });
  if (providerMode === "parts") return Response.json({ candidates: [{ finishReason: "STOP", content: { role: "model", parts: [{ text: "secret thought", thought: true }, { text: text.slice(0, 10) }, { text: text.slice(10), thoughtSignature: "secret signature" }] } }], usageMetadata: { totalTokenCount: 100 }, modelVersion: "test" });
  if (["empty-array", "blank-item", "wrong-type", "missing-field", "too-many", "too-long"].includes(providerMode)) {
    const result = { ...output[feature] }, key = Object.keys(result)[0];
    if (providerMode === "empty-array") result[key] = [];
    if (providerMode === "blank-item") result[key] = ["  "];
    if (providerMode === "wrong-type") result[key] = "secret";
    if (providerMode === "missing-field") delete result[key];
    if (providerMode === "too-many") result[key] = Array(9).fill("item");
    if (providerMode === "too-long") result[key] = ["x".repeat(1201)];
    return Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify(result) }] } }] });
  }
  if (providerMode === "fenced") return Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: "```json\n" + text + "\n```" }] } }] });
  return Response.json({ candidates: [{ finishReason: providerMode === "truncated" ? "MAX_TOKENS" : "STOP", content: { parts: [{ text }] } }] });
};
const mocks = {
  "server-only": {},
  "@/lib/auth": { getAuthenticatedUser: async () => user },
  "@/lib/mongodb": { connectToDatabase: async () => {} },
  "@/lib/models/Application": { ApplicationModel: { findOne: filter => ({ lean: async () => filter._id === id && filter.userId === owner ? application : null }) } },
  "@/lib/models/Opportunity": { OpportunityModel: { findOne: () => { throw new Error("External application must not query opportunities"); } } },
};
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const loadedModule = { exports: {} };
  function localRequire(name) {
    if (name in mocks) return mocks[name];
    return name.startsWith("@/") ? load(name.slice(2) + ".ts") : require(name);
  }
  vm.runInNewContext("(function(require,module,exports){" + code + "\n})", { Response, Request, TextDecoder, AbortSignal: TestAbortSignal, Error, Date: TestDate, process: { env: testEnv }, fetch: mockFetch, console: { ...console, error: (...args) => diagnostics.push(args) } }, { filename: file })(localRequire, loadedModule, loadedModule.exports);
  cache.set(file, loadedModule.exports);
  return loadedModule.exports;
}
let count = 0;
function check(value, message) { assert.ok(value, message); count++; console.log("AI PASS " + message); }
const routes = Object.fromEntries(["interview-prep", "application-insights"].map(feature => [feature, load(`app/api/ai/${feature}/route.ts`).POST]));
const request = (value = { applicationId: id }) => new Request("http://localhost/api/ai", { method: "POST", body: typeof value === "string" ? value : JSON.stringify(value) });
for (const [feature, post] of Object.entries(routes)) {
  owner = profile.id; application.userId = owner;
  user = null; check((await post(request())).status === 401, feature + " rejects anonymous");
  for (const role of ["employee", "admin", "superadmin"]) {
    user = { ...profile, role }; check((await post(request())).status === 403, feature + " rejects " + role);
  }
  user = { ...profile, id: "other-student" }; check((await post(request())).status === 404, feature + " rejects other owner's application");
  user = profile;
  check((await post(request({ applicationId: other }))).status === 404, feature + " missing application");
  check((await post(request({ applicationId: "bad" }))).status === 400, feature + " invalid ID");
  check((await post(request("{"))).status === 400, feature + " invalid JSON");
  check((await post(request("x".repeat(1025)))).status === 413, feature + " bounded body");
  check((await post(request({ applicationId: id, profile: {} }))).status === 400, feature + " rejects client profile");
  delete testEnv.GEMINI_API_KEY;
  const unavailable = await post(request());
  check(unavailable.status === 503 && (await unavailable.json()).message.includes("not configured"), feature + " friendly missing key");
  testEnv.GEMINI_API_KEY = "test-placeholder";
  owner = feature; user = { ...profile, id: owner }; application.userId = owner;
  const success = await post(request());
  check(success.status === 200 && JSON.stringify((await success.json()).data) === JSON.stringify(output[feature]), feature + " structured provider success");
  check(success.headers.get("cache-control") === "no-store", feature + " private uncached response");
  check((await post(request())).status === 429, feature + " repeat generation cooldown");
}
check(providerTimeouts.length === 2 && providerTimeouts.every(ms => ms === 45000), "both features allow 45 seconds for Gemini");
check(providerCalls === 2, "rejected requests never call Gemini");
const context = JSON.parse(lastRequest.contents[0].parts[0].text).data;
check(context.application.jobDescription.length === 12000 && !JSON.stringify(context).includes("PRIVATE") && !JSON.stringify(context).includes("private@example"), "bounded context excludes notes and email");
check(lastRequest.generationConfig.responseFormat.text.mimeType === "APPLICATION_JSON", "provider requests REST JSON schema enum");
for (const [mode, status] of [["invalid", 502], ["shape", 502], ["extra", 502], ["invalid-envelope", 502], ["truncated", 502], ["failure", 503], ["quota", 429], ["timeout", 504], ["network", 502]]) {
  owner = mode; user = { ...profile, id: owner }; application.userId = owner; providerMode = mode;
  const response = await routes["interview-prep"](request());
  const body = await response.text();
  check(response.status === status && !body.includes("secret") && !body.includes("test-placeholder"), mode + " fails safely");
  check(JSON.parse(body).code !== "AI_COOLDOWN", mode + " is not mapped to cooldown");
  if (mode === "failure") check(JSON.parse(body).code === "AI_PROVIDER_ACCESS_DENIED" && body.includes("access was denied"), "provider 403 reports access denial instead of cooldown");
  providerMode = "success";
  check((await routes["interview-prep"](request())).status === 200, mode + " failure releases cooldown for immediate retry");
}
owner = "cooldown-regression"; user = { ...profile, id: owner }; application.userId = owner;
check((await routes["interview-prep"](request())).status === 200, "first request passes even at time zero");
now += 9999;
const cooldown = await routes["application-insights"](request());
check(cooldown.status === 429 && cooldown.headers.get("Retry-After") === "1" && (await cooldown.json()).code === "AI_COOLDOWN", "both endpoints share a bounded per-user cooldown");
now += 1;
check((await routes["application-insights"](request())).status === 200, "request passes at exactly ten seconds; rejected requests do not extend expiry");
now += 15000;
check((await routes["interview-prep"](request())).status === 200, "request passes after fifteen seconds");
now += 10000;
providerMode = "pending";
const pendingResponse = routes["interview-prep"](request());
while (!releaseProvider) await new Promise(resolve => setImmediate(resolve));
now += 11000;
check((await routes["application-insights"](request())).status === 429, "in-flight provider request remains protected after ten seconds");
providerMode = "success"; releaseProvider();
check((await pendingResponse).status === 200, "in-flight request completes");
check((await routes["application-insights"](request())).status === 200, "long successful request does not start another ten-second window");
const { acquireAICooldown } = load("lib/ai-cooldown.ts");
const abandoned = acquireAICooldown("abandoned");
now += 35000;
const replacement = acquireAICooldown("abandoned");
check(abandoned.allowed && replacement.allowed, "abandoned lease expires");
abandoned.finish(false);
check(!acquireAICooldown("abandoned").allowed, "late failure cannot release replacement lease");
replacement.finish(false);
check(acquireAICooldown("abandoned").allowed, "failed replacement releases lease");
console.log(`SUCCESS ${count} AI assertions; no real Gemini requests.`);

for (const [feature, post] of Object.entries(routes)) {
  for (const mode of ["parts", "blocked", "no-candidates", "null-envelope", "null-part", "numeric-text", "empty-array", "blank-item", "wrong-type", "missing-field", "too-many", "too-long", "fenced"]) {
    owner = feature + "-" + mode; user = { ...profile, id: owner }; application.userId = owner; providerMode = mode;
    const response = await post(request());
    const body = await response.json();
    check(response.status === (mode === "parts" ? 200 : 502), feature + " handles " + mode);
    if (mode === "parts") assert.deepEqual(body.data, output[feature]);
    else check(body.code === "AI_INVALID_RESPONSE", feature + " identifies invalid response: " + mode);
  }
}
const logText = JSON.stringify(diagnostics);
check(!["secret", "test-placeholder", "PRIVATE", "private@example", "Explain a TypeScript project"].some(value => logText.includes(value)), "diagnostics exclude credentials, context, thoughts and generated text");
for (const stage of ["transport", "envelope-json", "response-shape", "response-parts", "guidance-json", "guidance-schema"]) check(diagnostics.some(entry => entry[1]?.stage === stage), "diagnostics distinguish " + stage);
check(diagnostics.some(entry => entry[1]?.issues?.some(issue => issue.code === "too_small")), "schema diagnostic reports safe issue code");
console.log(`SUCCESS ${count} total AI assertions; no real Gemini requests.`);
