import "server-only";

// Process-local, shared across both AI features; independent of auth limiters.
const entries = new Map<string, { starts: number[]; pending?: { expiresAt: number } }>();
const windowMs = 60000;
const pendingMs = 60000; // Safety lease exceeds the complete 48s route budget.

export function acquireAICooldown(userId: string) {
  const now = Date.now();
  for (const [key, entry] of entries) {
    entry.starts = entry.starts.filter(start => start > now - windowMs && start <= now);
    if (entry.pending && entry.pending.expiresAt <= now) entry.pending = undefined;
    if (!entry.pending && !entry.starts.length) entries.delete(key);
  }
  const entry = entries.get(userId) ?? { starts: [] };
  if (entry.pending) return { allowed: false as const, code: "AI_IN_FLIGHT", retryAfter: Math.max(1, Math.ceil((entry.pending.expiresAt - now) / 1000)), message: "AI guidance is already being generated. Please wait for it to finish." };
  if (entry.starts.length >= 5) {
    const retryAfter = Math.max(1, Math.ceil((entry.starts[0] + windowMs - now) / 1000));
    return { allowed: false as const, code: "AI_RATE_LIMIT", retryAfter, message: `Too many AI requests. Please try again in ${retryAfter} seconds.` };
  }
  const lease = { expiresAt: now + pendingMs };
  entry.pending = lease;
  entry.starts.push(now);
  entries.set(userId, entry);
  return {
    allowed: true as const,
    finish() {
      // A late completion must not release a newer request's lease.
      if (entries.get(userId)?.pending === lease) entry.pending = undefined;
    },
  };
}
