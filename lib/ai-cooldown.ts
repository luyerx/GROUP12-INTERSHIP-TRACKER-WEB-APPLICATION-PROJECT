import "server-only";

export const AI_MONTHLY_SOFT_LIMIT = 20;
export const AI_MONTHLY_HARD_LIMIT = 30;

const monthlyUsage = new Map<string, { monthKey: string; count: number; warned: boolean }>();

function monthKeyFor(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function pruneMonthlyUsage(now = Date.now()) {
  const cutoff = monthKeyFor(new Date(now));
  for (const [userId, entry] of monthlyUsage.entries()) {
    if (entry.monthKey !== cutoff) {
      monthlyUsage.delete(userId);
    }
  }
}

export function getAIUsageSummary(userId: string, now = Date.now()) {
  pruneMonthlyUsage(now);
  const monthKey = monthKeyFor(new Date(now));
  const entry = monthlyUsage.get(userId) ?? { monthKey, count: 0, warned: false };
  if (entry.monthKey !== monthKey) {
    const fresh = { monthKey, count: 0, warned: false };
    monthlyUsage.set(userId, fresh);
    return {
      monthKey,
      used: 0,
      softLimit: AI_MONTHLY_SOFT_LIMIT,
      hardLimit: AI_MONTHLY_HARD_LIMIT,
      remaining: AI_MONTHLY_HARD_LIMIT,
      warning: false,
      reachedSoftLimit: false,
      reachedHardLimit: false,
    };
  }

  const used = entry.count;
  const reachedSoftLimit = used >= AI_MONTHLY_SOFT_LIMIT;
  const reachedHardLimit = used >= AI_MONTHLY_HARD_LIMIT;
  const remaining = Math.max(0, AI_MONTHLY_HARD_LIMIT - used);
  return {
    monthKey,
    used,
    softLimit: AI_MONTHLY_SOFT_LIMIT,
    hardLimit: AI_MONTHLY_HARD_LIMIT,
    remaining,
    warning: reachedSoftLimit,
    reachedSoftLimit,
    reachedHardLimit,
  };
}

export function consumeAIUsage(userId: string, now = Date.now()) {
  pruneMonthlyUsage(now);
  const monthKey = monthKeyFor(new Date(now));
  const entry = monthlyUsage.get(userId) ?? { monthKey, count: 0, warned: false };
  if (entry.monthKey !== monthKey) {
    Object.assign(entry, { monthKey, count: 0, warned: false });
  }

  const nextUsage = entry.count + 1;
  entry.count = nextUsage;
  monthlyUsage.set(userId, entry);

  const summary = getAIUsageSummary(userId, now);
  const allowed = summary.used <= AI_MONTHLY_HARD_LIMIT;

  if (!allowed) {
    entry.count = Math.max(0, AI_MONTHLY_HARD_LIMIT);
    monthlyUsage.set(userId, entry);
    return {
      allowed: false as const,
      code: "AI_MONTHLY_LIMIT",
      usage: { ...summary, used: Math.max(0, AI_MONTHLY_HARD_LIMIT), remaining: 0, reachedHardLimit: true, warning: true },
      message: `You have reached the monthly AI usage limit (${AI_MONTHLY_HARD_LIMIT} requests). Please try again next month.`,
    };
  }

  const warning = nextUsage >= AI_MONTHLY_SOFT_LIMIT;
  if (warning && !entry.warned) {
    entry.warned = true;
    monthlyUsage.set(userId, entry);
  }

  return {
    allowed: true as const,
    usage: {
      ...summary,
      warning,
      reachedSoftLimit: nextUsage >= AI_MONTHLY_SOFT_LIMIT,
      reachedHardLimit: nextUsage >= AI_MONTHLY_HARD_LIMIT,
      remaining: Math.max(0, AI_MONTHLY_HARD_LIMIT - nextUsage),
    },
  };
}

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
