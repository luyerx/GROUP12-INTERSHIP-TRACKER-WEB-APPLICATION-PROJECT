import "server-only";

// Shared by the two AI features for a student, independently of auth limiters.
// Pending leases expire too, so an abandoned request cannot lock a user out.
const entries = new Map<string, { startedAt: number; expiresAt: number }>();
const cooldownMs = 10000;
const pendingMs = 35000;

export function acquireAICooldown(userId: string) {
  const now = Date.now();
  for (const [key, entry] of entries) {
    if (entry.expiresAt <= now || entry.startedAt > now) entries.delete(key);
  }
  const current = entries.get(userId);
  if (current) return { allowed: false as const, retryAfter: Math.max(1, Math.ceil((current.expiresAt - now) / 1000)) };

  const entry = { startedAt: now, expiresAt: now + pendingMs };
  entries.set(userId, entry);
  return {
    allowed: true as const,
    finish(success: boolean) {
      // A late completion must not release a newer request's lease.
      if (entries.get(userId) !== entry) return;
      if (success) entry.expiresAt = entry.startedAt + cooldownMs;
      else entries.delete(userId);
    },
  };
}
