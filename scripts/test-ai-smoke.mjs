// Opt-in live diagnostic. Logs metadata only, never keys or response text.
// Model capabilities verified against Google model pages on 2026-09-20.
import fs from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());
const key = process.env.GEMINI_API_KEY?.trim();
if (!key) throw new Error('GEMINI_API_KEY is not configured');
const current = fs.readFileSync(new URL('../lib/gemini.ts', import.meta.url), 'utf8').match(/GEMINI_MODEL = "([^"]+)"/)?.[1];
if (!current) throw new Error('Default Gemini model not found');
const models = [...new Set([current, 'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash'])];
const statuses = new Set(['INVALID_ARGUMENT', 'FAILED_PRECONDITION', 'OUT_OF_RANGE', 'UNAUTHENTICATED', 'PERMISSION_DENIED', 'NOT_FOUND', 'RESOURCE_EXHAUSTED', 'CANCELLED', 'ABORTED', 'DEADLINE_EXCEEDED', 'INTERNAL', 'UNKNOWN', 'UNAVAILABLE', 'UNIMPLEMENTED', 'DATA_LOSS']);
const body = JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Say hello in one sentence.' }] }], generationConfig: { thinkingConfig: { thinkingLevel: 'low' } } });
let first = true;
// Interleave candidates to reduce bias from a temporary outage in one time window.
for (let attempt = 1; attempt <= 3; attempt++) {
  for (const model of models) {
    if (!first) await delay(10000);
    first = false;
    const start = performance.now();
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST', signal: AbortSignal.timeout(45000),
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body,
      });
      let payload;
      try { payload = await response.json(); } catch { payload = {}; }
      const hasText = payload?.candidates?.[0]?.content?.parts?.some(p => p && !p.thought && typeof p.text === 'string' && p.text.trim().length > 0) === true;
      const success = response.status === 200 && hasText;
      console.log(JSON.stringify({ model, attempt, httpStatus: response.status, elapsedMs: Math.round(performance.now() - start), success, hasText, providerStatus: statuses.has(payload?.error?.status) ? payload.error.status : null, providerCode: Number.isInteger(payload?.error?.code) ? payload.error.code : null }));
      if (!success) process.exitCode = 1;
      if (response.status === 429) await delay(60000);
    } catch (error) {
      console.log(JSON.stringify({ model, attempt, httpStatus: null, elapsedMs: Math.round(performance.now() - start), success: false, error: ['TimeoutError', 'AbortError', 'TypeError'].includes(error.name) ? error.name : 'Error', transportCode: ['ENOTFOUND', 'EAI_AGAIN', 'ECONNRESET', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT'].includes(error.cause?.code) ? error.cause.code : null }));
      process.exitCode = 1;
    }
  }
}
