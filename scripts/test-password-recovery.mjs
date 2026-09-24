// Real transactions in an isolated database; every email uses a fake transport.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { createHash, randomBytes } from 'node:crypto';
import ts from 'typescript';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import nextEnv from '@next/env';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

nextEnv.loadEnvConfig(process.cwd());
const dbName = 'internship_tracker_test_r' + randomBytes(6).toString('hex');
process.env.MONGODB_DB = dbName;
process.env.NODE_ENV = 'production';
process.env.APP_BASE_URL = 'https://recovery.example.test';
process.env.RESEND_API_KEY = 'fake-test-key';
process.env.NOTIFICATION_FROM_EMAIL = 'sender@example.test';
const require = createRequire(import.meta.url), cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  }}).outputText;
  const m = { exports: {} };
  vm.runInThisContext('(function(require,module,exports){' + code + '\n})', { filename: file })(name => {
    if (name === 'server-only') return {};
    if (name === 'next/server') return { NextResponse: Response };
    if (name.startsWith('@/')) {
      const target = name.slice(2);
      return load(fs.existsSync(target + '.ts') ? target + '.ts' : target + '.tsx');
    }
    return require(name);
  }, m, m.exports);
  cache.set(file, m.exports);
  return m.exports;
}
let count = 0, address = 0, connected = false;
const check = (value, label) => { assert.ok(value, label); count++; console.log('PASS ' + label); };
async function call(route, body, ip = '192.0.2.' + (++address)) {
  const result = await route(new Request('https://untrusted.example.test/api/auth', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip }, body: JSON.stringify(body),
  }));
  return { status: result.status, body: await result.json() };
}
const originalFetch = globalThis.fetch;
const sent = [];
let mode = 200, transportHook;
globalThis.fetch = async (url, init) => {
  assert.equal(url, 'https://api.resend.com/emails');
  sent.push(JSON.parse(init.body));
  if (transportHook) await transportHook();
  if (mode === 'timeout') throw new DOMException('Fake timeout', 'AbortError');
  return new Response('{}', { status: mode });
};
try {
  const { getApplicationProgressItems } = load('lib/applicationProgress.ts');
  const Timeline = load('components/applications/ApplicationTimeline.tsx').default;
  for (const status of ['Interested', 'Preparing', 'Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn']) {
    const html = renderToStaticMarkup(React.createElement(Timeline, { timelineItems: getApplicationProgressItems(status) }));
    check(html.includes(status) && html.includes('Application Progress') && html.includes('Suggested next step'), status + ' progress renders');
    check(html.includes('not a record of past events') && !/sent to employer|Application submitted|Submitted on|Employer received/i.test(html), status + ' makes no invented history claims');
  }
  const policy = load('lib/accountPassword.ts').accountPasswordError;
  check(!policy('a'.repeat(72)) && !policy('你'.repeat(24)), '72 UTF-8 byte boundary accepted');
  check(Boolean(policy('你'.repeat(25))) && Boolean(policy('😀'.repeat(19))), 'multibyte bcrypt truncation rejected');
  await load('lib/mongodb.ts').connectToDatabase(); connected = true;
  assert.equal(mongoose.connection.name, dbName);
  const { UserModel: User } = load('lib/models/User.ts');
  const { PasswordResetTokenModel: Token } = load('lib/models/PasswordResetToken.ts');
  const { SessionModel: Session } = load('lib/models/Session.ts');
  await Promise.all([User.init(), Token.init(), Session.init()]);
  const forgot = load('app/api/auth/forgot-password/route.ts').POST;
  const reset = load('app/api/auth/reset-password/route.ts').POST;
  const register = load('app/api/auth/register/route.ts').POST;
  const oldPassword = 'Old-test-password-123';
  let userNumber = 0;
  async function makeUser(status = 'Active') {
    return User.create({ email: 'reset-' + (++userNumber) + '@example.test', fullName: 'Reset Test', status, passwordHash: await bcrypt.hash(oldPassword, 10) });
  }
  const rawFromLastEmail = () => new URL(sent.at(-1).text.match(/https:\/\/\S+/)[0]).searchParams.get('token');
  const digest = token => createHash('sha256').update(token).digest('hex');
  async function issue(user) {
    const result = await call(forgot, { email: user.email });
    assert.equal(result.status, 200);
    return rawFromLastEmail();
  }
  const user = await makeUser();
  const before = Date.now();
  transportHook = async () => {
    const pending = await Token.findOne({ userId: user._id });
    check(pending && !pending.usable, 'token cannot be consumed while email delivery is pending');
  };
  const result = await call(forgot, { email: user.email.toUpperCase() });
  transportHook = undefined;
  const token = rawFromLastEmail();
  const stored = await Token.findOne({ userId: user._id }).lean();
  check(result.status === 200 && !('resetUrl' in result.body) && !JSON.stringify(result.body).includes(token), 'production response contains no raw token or reset URL');
  check(stored.tokenHash === digest(token) && !JSON.stringify(stored).includes(token) && stored.usable, 'only hash stored, activated after delivery');
  check(stored.expiresAt.getTime() >= before + 29 * 60000 && stored.expiresAt.getTime() <= Date.now() + 30 * 60000, 'token expires in 30 minutes');
  check(sent.at(-1).subject.includes('Password reset') && sent.at(-1).text.includes('30 minutes') && sent.at(-1).text.includes('ignore') && sent.at(-1).text.includes(process.env.APP_BASE_URL), 'email subject, configured origin, expiry and ignore instructions');
  const unknown = await call(forgot, { email: 'unknown@example.test' });
  check(JSON.stringify(unknown) === JSON.stringify(result) && !(await Token.findOne({ tokenHash: digest(rawFromLastEmail()) })), 'unknown account response identical, inert token not persisted');
  const suspended = await makeUser('Suspended');
  const suspendedResult = await call(forgot, { email: suspended.email });
  check(JSON.stringify(suspendedResult) === JSON.stringify(result) && await Token.countDocuments({ userId: suspended._id }) === 0, 'suspended account response identical, no reset token');
  check((await call(reset, { token, password: oldPassword })).status === 400 && Boolean(await Token.findOne({ tokenHash: digest(token) })), 'same password rejected and transaction restores token');
  for (const password of ['short', 'x'.repeat(73), '你'.repeat(25), '😀'.repeat(19)]) {
    const a = await call(reset, { token, password });
    const b = await call(register, { fullName: 'Policy Test', email: 'policy@example.test', password });
    check(a.status === 400 && b.status === 400 && a.body.message === b.body.message, 'register and reset reject identical invalid password policy');
  }
  await Session.create({ token: randomBytes(32).toString('hex'), userId: user._id, expiresAt: new Date(Date.now() + 60000) });
  const nextPassword = 'New-test-password-456';
  check((await call(reset, { token, password: nextPassword })).status === 200, 'valid reset succeeds');
  check(await bcrypt.compare(nextPassword, (await User.findById(user._id)).passwordHash), 'new password stored as bcrypt hash');
  check(await Session.countDocuments({ userId: user._id }) === 0 && await Token.countDocuments({ userId: user._id }) === 0, 'all previous sessions and reset tokens revoked');
  check((await call(reset, { token, password: oldPassword })).status === 400, 'token reuse rejected');
  check((await call(reset, { token: randomBytes(32).toString('hex'), password: nextPassword })).status === 400, 'unknown token rejected');
  const expiredUser = await makeUser();
  const expired = await issue(expiredUser);
  await Token.updateOne({ tokenHash: digest(expired) }, { expiresAt: new Date(Date.now() - 1000) });
  check((await call(reset, { token: expired, password: nextPassword })).status === 400, 'expired token rejected without relying on TTL cleanup');
  const suspendedLater = await makeUser();
  const suspendedToken = await issue(suspendedLater);
  await User.updateOne({ _id: suspendedLater._id }, { status: 'Suspended' });
  check((await call(reset, { token: suspendedToken, password: nextPassword })).status === 400, 'account suspended after issue cannot reset');
  const concurrentUser = await makeUser();
  const concurrentToken = await issue(concurrentUser);
  const competing = await Promise.all([call(reset, { token: concurrentToken, password: nextPassword }), call(reset, { token: concurrentToken, password: nextPassword + '2' })]);
  check(competing.filter(r => r.status === 200).length === 1 && competing.filter(r => r.status === 400).length === 1, 'real concurrent MongoDB transactions: exactly one success');
  const rollbackUser = await makeUser();
  const rollbackToken = await issue(rollbackUser);
  const deleteSessions = Session.deleteMany;
  Session.deleteMany = () => { throw new Error('fake session failure'); };
  try {
    check((await call(reset, { token: rollbackToken, password: nextPassword })).status === 503, 'session revocation failure fails entire reset');
  } finally { Session.deleteMany = deleteSessions; }
  check(await bcrypt.compare(oldPassword, (await User.findById(rollbackUser._id)).passwordHash) && Boolean(await Token.findOne({ tokenHash: digest(rollbackToken) })), 'failed reset rolls back password and token consumption');
  for (const failure of [429, 500, 'timeout']) {
    mode = failure;
    const failureUser = await makeUser();
    const start = sent.length;
    const a = await call(forgot, { email: failureUser.email });
    const b = await call(forgot, { email: 'missing-' + String(failure) + '@example.test' });
    const c = await call(forgot, { email: (await makeUser('Suspended')).email });
    check(a.status === 503 && JSON.stringify(a) === JSON.stringify(b) && JSON.stringify(a) === JSON.stringify(c), String(failure) + ' failure identical for active, unknown and suspended addresses');
    check(await Token.countDocuments({ userId: failureUser._id }) === 0 && sent.length === start + 3, String(failure) + ' leaves no token and does not retry');
  }
  const cleanupUser = await makeUser();
  const deleteToken = Token.deleteOne;
  Token.deleteOne = () => Promise.reject(new Error('fake cleanup failure'));
  try { check((await call(forgot, { email: cleanupUser.email })).status === 503, 'cleanup failure still returns generic temporary failure'); }
  finally { Token.deleteOne = deleteToken; }
  const pending = await Token.findOne({ userId: cleanupUser._id });
  check(pending && !pending.usable && (await call(reset, { token: rawFromLastEmail(), password: nextPassword })).status === 400, 'cleanup failure leaves only an unusable expiring token');
  mode = 200;
  for (const base of ['', 'https://localhost', 'http://example.test', 'https://example.test/path', 'https://user:pass@example.test']) {
    process.env.APP_BASE_URL = base;
    check((await call(forgot, { email: 'config-' + address + '@example.test' })).status === 503, 'unsafe or absent production origin rejected');
  }
  process.env.APP_BASE_URL = 'https://recovery.example.test';
  delete process.env.RESEND_API_KEY;
  check((await call(forgot, { email: 'config-missing@example.test' })).status === 503, 'missing email provider configuration fails safely');
  process.env.RESEND_API_KEY = 'fake-test-key';
  const limited = 'limited@example.test';
  for (let i = 0; i < 3; i++) await call(forgot, { email: limited });
  check((await call(forgot, { email: limited })).status === 429, 'per-address rate limit applies even across different clients');
  console.log('SUCCESS ' + count + ' password recovery and progress assertions; no real emails sent.');
} finally {
  globalThis.fetch = originalFetch;
  if (connected) {
    assert.ok(dbName.startsWith('internship_tracker_test_r') && mongoose.connection.name === dbName);
    await mongoose.connection.dropDatabase();
    console.log('Isolated recovery test database removed.');
  }
  await mongoose.disconnect();
}
