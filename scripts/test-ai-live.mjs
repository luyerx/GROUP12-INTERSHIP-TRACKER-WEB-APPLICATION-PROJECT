// Opt-in live Gemini diagnostic. Uses an isolated database and synthetic data.
// Never logs credentials, provider bodies, or generated guidance.
import fs from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { MongoClient, ObjectId } from 'mongodb';
import nextEnv from '@next/env';
const require = createRequire(import.meta.url);
nextEnv.loadEnvConfig(process.cwd());
const dbName = 'ai_diagnostic_' + Date.now();
const base = 'http://127.0.0.1:3102';
let client, server, connected = false;
let stage = 'configuration';
const rows = [], diagnostics = [];
let fatal;
const count = Number(process.env.AI_LIVE_COUNT || 1);
const secondaryProbe = process.env.AI_PROBE_SECONDARY === '1';
if (!Number.isInteger(count) || count < 1 || count > 10) throw new Error('AI_LIVE_COUNT must be 1-10');
const report = process.env.AI_LIVE_REPORT;
const record = () => { if (report) fs.writeFileSync(report, JSON.stringify({ secondaryProbe, requestedPerFeature: count, fatal, rows }, null, 2)); };
try {
  const features = ['interview-prep', 'application-insights'];
  const selected = process.argv[2];
  if (selected && !features.includes(selected)) throw new Error('Unknown AI feature');
  if (!process.env.GEMINI_API_KEY?.trim() || !process.env.MONGODB_URI) throw new Error('Missing diagnostic configuration');
  stage = 'database-connect';
  client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  await client.connect(); connected = true;
  stage = 'fixture-setup';
  const db = client.db(dbName), userId = new ObjectId(), appId = new ObjectId();
  const token = randomBytes(32).toString('hex');
  await db.collection('users').insertOne({ _id: userId, fullName: 'AI Diagnostic Student', email: 'ai-diagnostic@example.test', role: 'student', status: 'Active', skills: ['TypeScript', 'React'], degree: 'BSc', major: 'Computer Science', preferredRoles: ['Software Developer'], preferredLocations: ['Auckland'] });
  await db.collection('sessions').insertOne({ userId, token, expiresAt: new Date(Date.now() + 3600000) });
  await db.collection('applications').insertOne({ _id: appId, userId, organisation: 'Diagnostic Example', roleTitle: 'Software Intern', location: 'Auckland', status: 'Applied', jobDescription: 'Build web applications using TypeScript and React. Work with a team, write tests and explain technical decisions.', createdAt: new Date(), updatedAt: new Date() });
  const detailedDescription = 'Software Engineering Internship, Auckland. Join a delivery team building a student placement management application. Responsibilities include implementing accessible React interfaces in TypeScript, developing authenticated REST endpoints in Node.js, validating form input and reviewing pull requests. Work with MongoDB records and explain trade-offs around data ownership and error handling. Write unit and browser tests, reproduce customer-reported defects, document fixes and discuss progress in weekly planning meetings. Required: current study in computer science or a related discipline, basic JavaScript and Git, clear written communication, willingness to ask questions and ability to collaborate. Useful but not essential: React, TypeScript, SQL or MongoDB, CI pipelines and deploying web applications. You are not expected to have commercial experience. The internship is supervised with code review and mentoring. Candidates should prepare evidence from coursework or personal projects and explain what they built, their contribution, testing approach and what they learned. Confirm working hours, internship duration, remuneration and eligibility with the employer because these are not specified in this listing.';
  const variants = [
    { id: appId, name: 'detailed', description: detailedDescription },
    { id: new ObjectId(), name: 'missing-details', description: 'Internship in an IT team. Support software delivery. Further requirements, tools, responsibilities and working arrangements have not been supplied.' },
    { id: new ObjectId(), name: 'long-description', description: detailedDescription + '\n' + Array.from({length: 12}, (_, i) => 'Delivery area ' + (i+1) + ': Review accessibility, permissions, API errors, test coverage and documentation. Explain decisions with concrete evidence, collaborate with a mentor, and verify acceptance criteria before release. Do not assume a candidate has used a tool just because it appears in this job description.').join('\n') },
  ];
  await db.collection('applications').updateOne({ _id: appId }, { $set: { jobDescription: detailedDescription } });
  for (const variant of variants.slice(1)) await db.collection('applications').insertOne({ _id: variant.id, userId, organisation: 'Reliability Test Employer', roleTitle: 'Software Engineering Intern', location: 'Auckland', status: 'Applied', jobDescription: variant.description, createdAt: new Date(), updatedAt: new Date() });
  stage = 'server-start';
  server = spawn(process.execPath, [...(secondaryProbe ? ['--import', new URL('./test-ai-secondary-preload.mjs', import.meta.url).href] : []), require.resolve('next/dist/bin/next'), 'start', '--port', '3102'], { env: { ...process.env, MONGODB_DB: dbName }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  // Forward only explicitly safe JSON diagnostics, never arbitrary server output.
  for (const stream of [server.stdout, server.stderr]) {
    let pending = '';
    stream.on('data', chunk => {
      pending += chunk.toString();
      const lines = pending.split('\n'); pending = lines.pop();
      for (const line of lines) if (line.startsWith('[AI diagnostic] ')) { try { diagnostics.push(JSON.parse(line.slice(16))); } catch {} console.log(line); }
    });
  }
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(base + '/login')).ok) { ready = true; break; } } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  if (!ready) throw new Error('Diagnostic server did not start');
  const schedule = Array.from({ length: count }, () => selected ? [selected] : features).flat();
  let previousSuccess = false;
  for (const [index, feature] of schedule.entries()) {
    // First Interview -> Insights pair is immediate; other requests are spaced.
    if (index > 0 && !(index === 1 && !selected && previousSuccess)) await delay(15000);
    const variant = variants[Math.floor(index / (selected ? 1 : 2)) % variants.length];
    const diagnosticStart = diagnostics.length;
    stage = feature;
    const start = performance.now();
    const response = await fetch(base + '/api/ai/' + feature, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: 'session_token=' + token }, body: JSON.stringify({ applicationId: variant.id.toString() }), signal: AbortSignal.timeout(65000) });
    const body = await response.json();
    await delay(100); // Drain the child's structured diagnostic output.
    const attempts = diagnostics.slice(diagnosticStart).filter(item => item.feature === feature);
    previousSuccess = response.ok && body.success === true;
    const row = { index: index + 1, feature, fixture: variant.name, httpStatus: response.status, elapsedMs: Math.round(performance.now() - start), success: previousSuccess, code: body.code, fallbackUsed: attempts.some(item => item.fallbackUsed), attempts: attempts.map(({ model, attempt, providerStatus, elapsedMs, success, code }) => ({ model, attempt, providerStatus, elapsedMs, success, code })), immediateAfterInterview: index === 1 && !selected };
    rows.push(row); record(); console.log(JSON.stringify(row));
    if (!previousSuccess) process.exitCode = 1;
    if (response.status === 429 || body.code === 'AI_PROVIDER_ACCESS_DENIED') break;
    if (rows.slice(-3).length === 3 && rows.slice(-3).every(item => !item.success)) break;
  }
} catch (error) {
  fatal = { stage, name: error.name, code: typeof error.code === 'string' && /^[A-Z_]+$/.test(error.code) ? error.code : undefined };
  console.error('Live diagnostic failed:', JSON.stringify(fatal)); process.exitCode = 1;
} finally {
  record();
  if (server && server.exitCode === null) { const ended = once(server, 'exit'); server.kill(); await ended; }
  if (client) { if (connected) await client.db(dbName).dropDatabase(); await client.close(); }
}
