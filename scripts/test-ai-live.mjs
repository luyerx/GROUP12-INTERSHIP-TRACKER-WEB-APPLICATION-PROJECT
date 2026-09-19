// Opt-in live Gemini diagnostic. Uses an isolated database and synthetic data.
// Never logs credentials, provider bodies, or generated guidance.
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
  await db.collection('sessions').insertOne({ userId, token, expiresAt: new Date(Date.now() + 600000) });
  await db.collection('applications').insertOne({ _id: appId, userId, organisation: 'Diagnostic Example', roleTitle: 'Software Intern', location: 'Auckland', status: 'Applied', jobDescription: 'Build web applications using TypeScript and React. Work with a team, write tests and explain technical decisions.', createdAt: new Date(), updatedAt: new Date() });
  stage = 'server-start';
  server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '--port', '3102'], { env: { ...process.env, MONGODB_DB: dbName }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  // Forward only explicitly safe JSON diagnostics, never arbitrary server output.
  for (const stream of [server.stdout, server.stderr]) {
    let pending = '';
    stream.on('data', chunk => {
      pending += chunk.toString();
      const lines = pending.split('\n'); pending = lines.pop();
      for (const line of lines) if (line.startsWith('[AI diagnostic] ')) console.log(line);
    });
  }
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(base + '/login')).ok) { ready = true; break; } } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  if (!ready) throw new Error('Diagnostic server did not start');
  for (const feature of selected ? [selected] : features) {
    stage = feature;
    const start = performance.now();
    const response = await fetch(base + '/api/ai/' + feature, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: 'session_token=' + token }, body: JSON.stringify({ applicationId: appId.toString() }), signal: AbortSignal.timeout(65000) });
    const body = await response.json();
    console.log(JSON.stringify({ feature, httpStatus: response.status, elapsedMs: Math.round(performance.now() - start), success: body.success, code: body.code, sections: body.data ? Object.keys(body.data) : undefined }));
    if (!response.ok || !body.success) { process.exitCode = 1; break; }
    if (feature === 'interview-prep') await new Promise(r => setTimeout(r, 10000));
  }
} catch (error) {
  console.error('Live diagnostic failed:', JSON.stringify({ stage, name: error.name, code: typeof error.code === 'string' && /^[A-Z_]+$/.test(error.code) ? error.code : undefined })); process.exitCode = 1;
} finally {
  if (server && server.exitCode === null) { const ended = once(server, 'exit'); server.kill(); await ended; }
  if (client) { if (connected) await client.db(dbName).dropDatabase(); await client.close(); }
}
