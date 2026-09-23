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
let now = 0, releaseProvider, releaseBackoff, holdBackoff = false;
let sequence = [], expireBudget, expireAttempt, lastSignal, releaseLookup, holdLookup = false;
const models = [];
const delays = [];
const providerTimeouts = [];
const diagnostics = [];
const TestAbortSignal = { any: signals => AbortSignal.any(signals), timeout(ms) { providerTimeouts.push(ms); return AbortSignal.timeout(ms); } };
class TestDate extends Date { static now() { return now; } }
const profile = { id: owner, role: "student", skills: ["TypeScript"], degree: "BSc", major: "Computing", preferredRoles: ["Developer"], preferredLocations: [], email: "private@example.test" };
const application = { _id: id, userId: owner, organisation: "Example", roleTitle: "Intern", status: "Applied", jobDescription: "Build web apps. " + "x".repeat(20000), notes: "PRIVATE NOTES", createdAt: new Date(), updatedAt: new Date() };
const output = {
  "interview-prep": { interviewQuestions: ["Explain a TypeScript project."], skillsToHighlight: ["TypeScript"], preparationTips: ["Prepare an example."], questionsForEmployer: ["How is mentoring organised?"] },
  "application-insights": { strengths: ["TypeScript is listed."], areasToPrepare: ["Verify missing requirements."], applicationTips: ["Describe a project."], preparationChecklist: ["Review the job listing."] },
};
const mockFetch = async (_url, options) => {
  lastSignal = options.signal;
  const outcome = sequence.shift();
  providerCalls++;
  models.push(_url.match(/models\/([^:]+)/)[1]);
  if (typeof outcome === "number") return new Response("secret", { status: outcome });
  if (outcome === "timeout") throw new DOMException("secret", "TimeoutError");
  if (outcome === "hang" || outcome === "body-hang") {
    releaseProvider = () => {};
    if (outcome === "hang") return new Promise(() => {});
    return { status: 200, ok: true, text: () => new Promise(() => {}) };
  }
  if (outcome === "reset") throw Object.assign(new Error("secret"), { code: "ECONNRESET" });
  if (outcome === "exhausted") { now += 47500; throw Object.assign(new Error("secret"), { code: "ECONNRESET" }); }
  if (outcome === "body-reset") return { status: 200, ok: true, text: async () => { throw Object.assign(new Error("secret"), { cause: { code: "ECONNRESET" } }); } };
  if (outcome === "slow-reset") { now += 22000; throw Object.assign(new Error("secret"), { code: "ECONNRESET" }); }
  lastRequest = JSON.parse(options.body);
  assert.equal(lastRequest.generationConfig.responseFormat.text.mimeType, "APPLICATION_JSON", "REST requires the MIME enum, not the SDK MIME string");
  assert.equal(lastRequest.generationConfig.thinkingConfig.thinkingLevel, "low");
  if (providerMode === "abort-pending") await new Promise((resolve, reject) => { releaseProvider = resolve; options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true }); });
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
  "@/lib/models/Application": { ApplicationModel: { findOne: filter => ({ lean: async () => { if (holdLookup) await new Promise(resolve => { releaseLookup = resolve; }); return filter._id === id && filter.userId === owner ? application : null; } }) } },
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
  vm.runInNewContext("(function(require,module,exports){" + code + "\n})", { Response, Request, TextDecoder, AbortSignal: TestAbortSignal, AbortController, DOMException, clearTimeout, setTimeout: (callback, ms) => {
    if (ms === 48000) expireBudget = callback;
    if (ms === 22000) { expireAttempt = callback; providerTimeouts.push(ms); }
    if (ms >= 5000) return setTimeout(callback, ms);
    delays.push(ms);
    const complete = () => { now += ms; callback(); };
    if (holdBackoff) { releaseBackoff = complete; return undefined; }
    return setTimeout(complete, 0);
  }, Error, Date: TestDate, process: { env: testEnv }, fetch: mockFetch, console: { ...console, info: (...args) => diagnostics.push(args), error: (...args) => diagnostics.push(args) } }, { filename: file })(localRequire, loadedModule, loadedModule.exports);
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
  check((await post(request())).status === 200, feature + " immediate repeat generation allowed");
}
check(providerTimeouts.length === 4 && providerTimeouts.every(ms => ms === 22000), "both features bound each Gemini attempt to 22 seconds");
check(providerCalls === 4, "rejected requests never call Gemini");
const context = JSON.parse(lastRequest.contents[0].parts[0].text).data;
check(context.application.jobDescription.length === 12000 && !JSON.stringify(context).includes("PRIVATE") && !JSON.stringify(context).includes("private@example"), "bounded context excludes notes and email");
check(lastRequest.generationConfig.responseFormat.text.mimeType === "APPLICATION_JSON", "provider requests REST JSON schema enum");
for (const [mode, status] of [["invalid", 502], ["shape", 502], ["extra", 502], ["invalid-envelope", 502], ["truncated", 502], ["failure", 503], ["quota", 429], ["timeout", 504], ["network", 503]]) {
  owner = mode; user = { ...profile, id: owner }; application.userId = owner; providerMode = mode;
  const before = providerCalls;
  const response = await routes["interview-prep"](request());
  const body = await response.text();
  if (["invalid", "shape", "extra", "invalid-envelope", "truncated", "failure"].includes(mode)) check(providerCalls - before === 1, mode + " does not retry or switch models");
  check(response.status === status && !body.includes("secret") && !body.includes("test-placeholder"), mode + " fails safely");
  check(JSON.parse(body).code !== "AI_COOLDOWN", mode + " is not mapped to cooldown");
  if (mode === "failure") check(JSON.parse(body).code === "AI_PROVIDER_ACCESS_DENIED" && body.includes("contact the project administrator"), "provider 403 reports access denial instead of cooldown");
  providerMode = "success";
  check((await routes["interview-prep"](request())).status === 200, mode + " failure releases lock for immediate retry");
}
owner = "reliability"; user = { ...profile, id: owner }; application.userId = owner;
check((await routes["interview-prep"](request())).status === 200, "Interview succeeds");
check((await routes["application-insights"](request())).status === 200, "Insights immediately after Interview succeeds without cooldown");
for (let i = 0; i < 3; i++) check((await routes["interview-prep"](request())).status === 200, "new generation within five-request limit");
const limited = await routes["application-insights"](request());
check(limited.status === 429 && limited.headers.get("Retry-After") === "60" && (await limited.json()).code === "AI_RATE_LIMIT", "sixth new generation limited with accurate retry-after");
now += 59999;
check((await routes["interview-prep"](request())).headers.get("Retry-After") === "1", "sliding window remains limited at 59.999s");
now++;
check((await routes["interview-prep"](request())).status === 200, "window expires at exactly sixty seconds");
providerMode = "pending";
const pendingResponse = routes["interview-prep"](request());
while (!releaseProvider) await new Promise(resolve => setImmediate(resolve));
now += 45000;
const duplicate = await routes["application-insights"](request());
check(duplicate.status === 429 && (await duplicate.json()).code === "AI_IN_FLIGHT", "in-flight lock survives 35s and 45s; blocks both features");
providerMode = "success"; releaseProvider();
check((await pendingResponse).status === 200, "in-flight request completes");
check((await routes["application-insights"](request())).status === 200, "completion explicitly releases lock");
const { acquireAICooldown } = load("lib/ai-cooldown.ts");
const abandoned = acquireAICooldown("abandoned");
now += 59999;
check(!acquireAICooldown("abandoned").allowed, "safety lease lasts sixty seconds");
now++;
const replacement = acquireAICooldown("abandoned");
check(abandoned.allowed && replacement.allowed, "abandoned lease expires");
abandoned.finish();
check(!acquireAICooldown("abandoned").allowed, "late completion cannot release replacement lease");
replacement.finish();
check(acquireAICooldown("abandoned").allowed, "replacement explicitly releases lease");
for (const [name, outcomes, expected, calls] of [
  ["503 then success", [503], 200, 2],
  ["all attempts 503", [503, 503, 503], 503, 3],
  ["secondary 503 then primary recovers", [503, 503], 200, 3],
  ["primary quota then secondary recovery", [429, 503], 200, 3],
  ["both models quota", [429, 429, 429], 429, 3],
  ["fallback access denied", [503, 403], 503, 2],
  ["primary timeout then fallback success", ["timeout"], 200, 2],
  ["403 deterministic", [403], 503, 1],
  ["400 deterministic", [400], 503, 1],
  ["401 deterministic", [401], 503, 1],
  ["404 deterministic", [404], 503, 1],
  ["ECONNRESET then success", ["reset"], 200, 2],
  ["response body reset", ["body-reset"], 200, 2],
  ["budget insufficient for retry", ["exhausted"], 504, 1],
  ...[429, 500, 502, 504].map(status => [status + " then success", [status], 200, 2]),
]) {
  owner = name; user = { ...profile, id: owner }; application.userId = owner;
  sequence = [...outcomes];
  const before = providerCalls;
  const modelStart = models.length;
  const response = await routes["interview-prep"](request());
  check(response.status === expected && providerCalls - before === calls, name + " has correct HTTP and attempt count");
  check(JSON.stringify(models.slice(modelStart)) === JSON.stringify(["gemini-3.5-flash", "gemini-3.5-flash-lite", outcomes[0] === 429 ? "gemini-3.5-flash-lite" : "gemini-3.5-flash"].slice(0, calls)), name + " uses the expected models");
  if (expected !== 200) {
    check((await response.json()).message.includes("Please"), name + " friendly error");
    check((await routes["application-insights"](request())).status === 200, name + " immediate manual retry succeeds");
  }
}
owner = "retry-lock"; user = { ...profile, id: owner }; application.userId = owner;
sequence = ["slow-reset"]; holdBackoff = true;
const retrying = routes["interview-prep"](request());
while (!releaseBackoff) await new Promise(resolve => setImmediate(resolve));
check((await routes["application-insights"](request())).status === 429, "pending lease protects retry backoff after primary 22-second attempt");
holdBackoff = false; releaseBackoff();
check((await retrying).status === 200, "retry within total budget succeeds");
check(providerTimeouts.at(-1) === 22000, "fallback retains a full 22-second opportunity");
check(delays.every(ms => ms >= 800 && ms <= 2400), "bounded 800-1200ms then 1600-2400ms backoff with jitter");
owner = "retry-count"; user = { ...profile, id: owner }; application.userId = owner;
for (let i = 0; i < 5; i++) {
  sequence = [503];
  check((await routes["interview-prep"](request())).status === 200, "provider retries do not consume extra user rate-limit slots");
}
check((await routes["interview-prep"](request())).status === 429, "five new requests still enforce rate limit after retries");
owner = "budget-expiry"; user = { ...profile, id: owner }; application.userId = owner;
providerMode = "abort-pending"; releaseProvider = undefined;
const expiring = routes["interview-prep"](request());
while (!releaseProvider) await new Promise(resolve => setImmediate(resolve));
const pendingSignal = lastSignal;
now += 48000; expireBudget();
check((await expiring).status === 504 && pendingSignal.aborted, "48-second total deadline aborts provider and returns friendly timeout");
providerMode = "success";
check((await routes["application-insights"](request())).status === 200, "total timeout releases lock for immediate manual retry");
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
const metadata = diagnostics.filter(entry => entry[0].startsWith("[AI diagnostic] ")).map(entry => JSON.parse(entry[0].slice(16)));
for (const stage of ["transport", "envelope-json", "response-shape", "response-parts", "guidance-json", "guidance-schema"]) check(metadata.some(entry => entry.stage === stage), "diagnostics distinguish " + stage);
check(metadata.some(entry => entry.issues?.some(issue => issue.code === "too_small")), "schema diagnostic reports safe issue code");
console.log(`SUCCESS ${count} total AI assertions; no real Gemini requests.`);

providerMode = "success";
for (const outcome of ["hang", "body-hang"]) {
  owner = outcome; user = { ...profile, id: owner }; application.userId = owner;
  sequence = [outcome]; releaseProvider = undefined;
  const before = providerCalls;
  const pending = routes["interview-prep"](request());
  while (!releaseProvider) await new Promise(resolve => setImmediate(resolve));
  const signal = lastSignal;
  now += 22000; expireAttempt();
  check((await pending).status === 200 && providerCalls - before === 2 && signal.aborted, outcome + " is bounded even if transport ignores abort; fallback succeeds");
  check((await routes["application-insights"](request())).status === 200, outcome + " releases lease");
}
owner = "abort-backoff"; user = { ...profile, id: owner }; application.userId = owner;
sequence = [503]; holdBackoff = true; releaseBackoff = undefined;
const beforeAbort = providerCalls;
const stopped = routes["interview-prep"](request());
while (!releaseBackoff) await new Promise(resolve => setImmediate(resolve));
expireBudget(); holdBackoff = false;
check((await stopped).status === 504 && providerCalls === beforeAbort + 1, "outer abort during backoff never starts fallback");
owner = "disconnect"; user = { ...profile, id: owner }; application.userId = owner;
const disconnect = new AbortController();
providerMode = "abort-pending"; releaseProvider = undefined;
const disconnected = routes["interview-prep"](new Request("http://localhost/api/ai", { method: "POST", body: JSON.stringify({ applicationId: id }), signal: disconnect.signal }));
while (!releaseProvider) await new Promise(resolve => setImmediate(resolve));
const disconnectSignal = lastSignal; disconnect.abort();
check((await disconnected).status === 504 && disconnectSignal.aborted, "client disconnect aborts provider");
providerMode = "success";
check((await routes["application-insights"](request())).status === 200, "disconnect releases lock");
console.log(`SUCCESS ${count} final AI assertions; no real Gemini requests.`);

owner = "two-slow-attempts"; user = { ...profile, id: owner }; application.userId = owner;
sequence = ["hang", "body-hang"]; releaseProvider = undefined;
const slowBefore = providerCalls;
const slow = routes["interview-prep"](request());
while (!releaseProvider) await new Promise(resolve => setImmediate(resolve));
releaseProvider = undefined; now += 22000; expireAttempt();
while (!releaseProvider) await new Promise(resolve => setImmediate(resolve));
now += 22000; expireAttempt();
check((await slow).status === 504 && providerCalls === slowBefore + 2, "two slow attempts cannot launch an underfunded third request");
owner = "lookup-hang"; user = { ...profile, id: owner }; application.userId = owner;
holdLookup = true; releaseLookup = undefined;
const lookupBefore = providerCalls;
const lookup = routes["interview-prep"](request());
while (!releaseLookup) await new Promise(resolve => setImmediate(resolve));
expireBudget();
check((await lookup).status === 504, "outer budget bounds context lookup before Gemini");
holdLookup = false; releaseLookup();
await new Promise(resolve => setImmediate(resolve));
check(providerCalls === lookupBefore, "late database completion cannot start a provider attempt or acquire a lease");
check((await routes["interview-prep"](request())).status === 200, "request after lookup timeout is not locked");
let bodyCancelled = false;
const bodyBefore = providerCalls;
const stalledBody = routes["interview-prep"](new Request("http://localhost/api/ai", { method: "POST", duplex: "half", body: new ReadableStream({ cancel() { bodyCancelled = true; } }) }));
await new Promise(resolve => setImmediate(resolve)); expireBudget();
check((await stalledBody).status === 504 && bodyCancelled && providerCalls === bodyBefore, "stalled incoming body is cancelled by the total route deadline");
console.log(`SUCCESS ${count} final AI assertions; no real Gemini requests.`);
