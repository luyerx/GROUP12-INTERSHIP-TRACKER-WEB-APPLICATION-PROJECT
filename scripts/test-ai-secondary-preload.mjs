// Test-process-only fault injection: the real route must recover through real Gemini.
// Never imported by application code. Requires explicit opt-in in test-ai-live.mjs.
if (process.env.AI_PROBE_SECONDARY !== '1') throw new Error('Secondary probe requires explicit opt-in');
const original = globalThis.fetch;
globalThis.fetch = (input, options) => {
  const url = String(input);
  if (url === 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent') return Promise.resolve(new Response('', { status: 503 }));
  return original(input, options);
};
