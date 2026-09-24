import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const compiled = ts.transpileModule(fs.readFileSync("lib/notifications/rules.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const sandboxModule = { exports: {} };
vm.runInThisContext("(function(module,exports){" + compiled + "\n})")(sandboxModule, sandboxModule.exports);
const { runReminders, occurrence, cronAuthorized, DeliveryRejected } = sandboxModule.exports;
const now = new Date("2026-09-23T23:00:00Z");
const user = { id: "u1", email: "student@example.test", role: "student", status: "Active", emailNotifications: true, deadlineReminders: true, interviewReminders: true };
const deadline = { id: "a1", userId: "u1", organisation: "Example", title: "Intern", date: "2026-09-24" };
const interview = { id: "e1", userId: "u1", applicationId: "a1", organisation: "Example", title: "Interview", date: "2026-09-24", time: "23:00" };
function fixture({ users = { u1: user }, applications = [deadline], interviews = [interview], owns = true, fail = false } = {}) {
 const logs = new Set(), sends = [];
 const deps = {
  applications: async () => applications, interviews: async () => interviews,
  user: async id => users[id] ?? null, ownsApplication: async () => owns,
  claim: async key => logs.has(key) ? null : (logs.add(key), { key, token: "test" }),
  begin: async () => {}, current: async (_kind, candidate) => candidate,
  sent: async () => {}, release: async ({key}) => { logs.delete(key); },
  send: async (...args) => { if (fail) throw new DeliveryRejected("provider unavailable"); sends.push(args); },
  diagnose: () => {},
 };
 return { deps, sends, logs, setFailure(value) { fail = value; } };
}
let count = 0;
async function check(name, config, expected) {
 const f = fixture(config); const result = await runReminders(f.deps, now);
 assert.equal(result.sent, expected); assert.equal(f.sends.length, expected); count++; console.log("PASS", name); return f;
}
await check("both reminders enabled", {}, 2);
await check("master off", { users: {u1: {...user, emailNotifications: false}} }, 0);
await check("deadline enabled", { interviews: [] }, 1);
await check("deadline disabled", { interviews: [], users: {u1: {...user, deadlineReminders: false}} }, 0);
await check("interview enabled", { applications: [] }, 1);
await check("interview disabled", { applications: [], users: {u1: {...user, interviewReminders: false}} }, 0);
const repeat = fixture(); await runReminders(repeat.deps, now); assert.equal((await runReminders(repeat.deps, now)).sent, 0); count++; console.log("PASS duplicate suppressed");
const failed = fixture({ fail: true }); assert.equal((await runReminders(failed.deps, now)).sent, 0); assert.equal(failed.logs.size, 0); count++; console.log("PASS failed provider not marked sent");
failed.setFailure(false); assert.equal((await runReminders(failed.deps, now)).sent, 2); count++; console.log("PASS retry after failure");
await check("suspended", { users: {u1: {...user, status: "Suspended"}} }, 0);
await check("missing user", { users: {} }, 0);
await check("invalid dates", { applications: [{...deadline, date: "2026-02-30"}], interviews: [{...interview, time: "noon"}] }, 0);
await check("unowned interview", { applications: [], owns: false }, 0);
assert.equal(cronAuthorized("Bearer wrong", "right"), false); assert.equal(cronAuthorized("Bearer right", "right"), true); count += 2; console.log("PASS cron authorization both branches");
const isolated = fixture({ applications: [{...deadline, id: "bad", userId: "u2"}, deadline], users: {u1: user, u2: {...user, id: "u2"}}, interviews: [], fail: false });
const send = isolated.deps.send; isolated.deps.send = async (to, subject, body) => { if (to === "student@example.test" && body.includes("FAILME")) throw Error("failure"); return send(to, subject, body); };
// First record has an invalid date; the next valid record must still send.
isolated.deps.applications = async () => [{...deadline, id: "bad", date: "invalid"}, deadline];
assert.equal((await runReminders(isolated.deps, now)).sent, 1); count++; console.log("PASS one bad record does not stop batch");
const failedOne = fixture({ applications: [{...deadline, id: "a0", title: "FAILME"}, deadline], interviews: [] });
const normalSend = failedOne.deps.send; failedOne.deps.send = async (to, subject, body) => { if (body.includes("FAILME")) throw new DeliveryRejected("provider failure"); return normalSend(to, subject, body); };
const summary = await runReminders(failedOne.deps, now); assert.equal(summary.failed, 1); assert.equal(summary.sent, 1); count++; console.log("PASS one provider failure does not stop batch");
assert.equal(occurrence("interview", "2026-09-24", ""), null); count++; console.log("PASS missing interview time skipped");
console.log("SUCCESS", count, "notification assertions");

// Exercise the cron route with a stub runner: authentication occurs before any database work.
const routeCode = ts.transpileModule(fs.readFileSync("app/api/cron/reminders/route.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const routeModule = { exports: {} };
let runs = 0;
vm.runInThisContext("(function(require,module,exports){" + routeCode + "\n})")((name) => {
 if (name.endsWith("/runner")) return { executeReminders: async () => { runs++; return { checked: 0, sent: 0, skipped: 0, failed: 0 }; } };
 if (name.endsWith("/rules")) return { cronAuthorized };
 throw Error("Unexpected dependency");
}, routeModule, routeModule.exports);
const previousSecret = process.env.CRON_SECRET; process.env.CRON_SECRET = "test-only-secret";
try {
 assert.equal((await routeModule.exports.GET(new Request("http://localhost/api/cron/reminders", {headers: {authorization: "Bearer wrong"}}))).status, 401);
 assert.equal(runs, 0);
 assert.equal((await routeModule.exports.GET(new Request("http://localhost/api/cron/reminders", {headers: {authorization: "Bearer test-only-secret"}}))).status, 200);
 assert.equal(runs, 1);
 console.log("PASS actual cron route rejects wrong secret and runs with correct secret");
} finally { if (previousSecret === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = previousSecret; }
// Additional delivery regressions: no real email provider calls.
for (const [label, modify] of [
 ['unknown delivery outcome', f => { f.deps.send = async () => { throw Error('timeout after possible acceptance'); }; }],
 ['accepted email with failed sent persistence', f => { f.deps.sent = async () => { throw Error('database unavailable'); }; }],
]) {
 const f = fixture({ interviews: [] }); modify(f);
 assert.equal((await runReminders(f.deps, now)).failed, 1);
 assert.equal(f.logs.size, 1);
 assert.equal((await runReminders(f.deps, now)).sent, 0);
 console.log('PASS', label, 'is retained and cannot send twice');
}
const concurrent = fixture();
const batches = await Promise.all([runReminders(concurrent.deps, now), runReminders(concurrent.deps, now)]);
assert.equal(batches.reduce((n, r) => n + r.sent, 0), 2);
assert.equal(concurrent.sends.length, 2);
console.log('PASS concurrent scans claim each reminder once');
for (const current of [null, {...deadline, date: '2026-09-25'}, {...deadline, userId: 'other'}]) {
 const f = fixture({ interviews: [] }); f.deps.current = async () => current;
 assert.equal((await runReminders(f.deps, now)).sent, 0); assert.equal(f.logs.size, 0);
}
console.log('PASS deleted, rescheduled and reassigned source records skipped');
const switched = fixture({ interviews: [] }); let reads = 0;
switched.deps.user = async () => (++reads === 1 ? user : {...user, emailNotifications: false});
assert.equal((await runReminders(switched.deps, now)).sent, 0);
console.log('PASS preference changed during scan prevents sending');
const lost = fixture({ interviews: [] }); lost.deps.begin = async () => { throw Error('lease lost'); };
assert.equal((await runReminders(lost.deps, now)).sent, 0); assert.equal(lost.sends.length, 0);
console.log('PASS expired or lost claim cannot send');
const emailCode = ts.transpileModule(fs.readFileSync('lib/notifications/email.ts', 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const emailModule = {exports:{}};
const crypto = await import('node:crypto');
vm.runInThisContext('(function(require,module,exports){' + emailCode + '\n})')(name => {
 if (name === 'server-only') return {};
 if (name === 'crypto') return crypto;
 if (name.endsWith('/rules')) return {DeliveryRejected};
 throw Error('Unexpected dependency');
}, emailModule, emailModule.exports);
const originalFetch = globalThis.fetch;
const saved = {key:process.env.RESEND_API_KEY,from:process.env.NOTIFICATION_FROM_EMAIL};
try {
 process.env.RESEND_API_KEY = 'test-only-key'; process.env.NOTIFICATION_FROM_EMAIL = 'test@example.test';
 const calls=[]; globalThis.fetch = async (url, init) => { calls.push({url,init}); return new Response('{}',{status:200}); };
 await emailModule.exports.sendReminderEmail(user.email,'test','body','same-reminder');
 await emailModule.exports.sendReminderEmail(user.email,'test','body','same-reminder');
 assert.equal(calls[0].url,'https://api.resend.com/emails');
 assert.equal(calls[0].init.headers['Idempotency-Key'],calls[1].init.headers['Idempotency-Key']);
 assert.deepEqual(JSON.parse(calls[0].init.body).to,[user.email]);
 assert.ok(calls[0].init.signal);
 for (const status of [400,401,403,422,429]) {
  globalThis.fetch = async () => new Response('{}',{status});
  await assert.rejects(emailModule.exports.sendReminderEmail(user.email,'test','body','same'),DeliveryRejected);
 }
 globalThis.fetch = async () => new Response('{}',{status:500});
 await assert.rejects(emailModule.exports.sendReminderEmail(user.email,'test','body','same'),e => !(e instanceof DeliveryRejected));
 globalThis.fetch = async () => {throw Error('timeout')};
 await assert.rejects(emailModule.exports.sendReminderEmail(user.email,'test','body','same'),e => !(e instanceof DeliveryRejected));
 delete process.env.RESEND_API_KEY;
 await assert.rejects(emailModule.exports.sendReminderEmail(user.email,'test','body','same'),DeliveryRejected);
 console.log('PASS actual provider adapter: payload, stable key, definite vs ambiguous failure and missing configuration');
} finally {
 globalThis.fetch=originalFetch;
 for(const [name,value] of [['RESEND_API_KEY',saved.key],['NOTIFICATION_FROM_EMAIL',saved.from]]) {if(value===undefined)delete process.env[name];else process.env[name]=value;}
}
for(const auth of [null,'Basic invalid','Bearer ']) assert.equal(cronAuthorized(auth,'secret'),false);
assert.equal(cronAuthorized('Bearer anything',undefined),false);
console.log('SUCCESS additional notification failure/concurrency/provider regressions');
