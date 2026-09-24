import { aucklandOccurrence, formatAucklandTime } from "@/lib/aucklandTime";

export const REMINDER_LEAD_HOURS = 24;
export const REMINDER_SCAN_HOURS = 24;
export const REMINDER_WINDOW_MS = (REMINDER_LEAD_HOURS + REMINDER_SCAN_HOURS) * 60 * 60 * 1000;
export const CLAIM_LEASE_MS = 5 * 60 * 1000;

export type ReminderKind = "deadline" | "interview";
export type Candidate = { id: string; userId: string; applicationId?: string; organisation: string; title: string; date: string; time?: string };
export type Recipient = { id: string; email: string; role: string; status: string; emailNotifications?: boolean; deadlineReminders?: boolean; interviewReminders?: boolean };

// Date-only deadlines end at 23:59:59.999 in Auckland; interviews use its local clock.
export function occurrence(kind: ReminderKind, date: string, time = ""): Date | null {
  return aucklandOccurrence(date, kind === "deadline" ? "23:59" : time, kind === "deadline");
}

export function eligible(kind: ReminderKind, candidate: Candidate, user: Recipient | null, now: Date): Date | null {
  if (!user || user.id !== candidate.userId || user.role !== "student" || user.status !== "Active" || !user.email || user.emailNotifications === false) return null;
  if (kind === "deadline" && user.deadlineReminders === false) return null;
  if (kind === "interview" && user.interviewReminders === false) return null;
  const due = occurrence(kind, candidate.date, candidate.time);
  if (!due) return null;
  const remaining = due.getTime() - now.getTime();
  return remaining > 0 && remaining <= REMINDER_WINDOW_MS ? due : null;
}

export function cronAuthorized(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header?.startsWith("Bearer ")) return false;
  const supplied = header.slice(7);
  // Avoid comparing secrets with variable timing; equal-length buffers are required.
  if (supplied.length !== secret.length) return false;
  let difference = 0;
  for (let i = 0; i < secret.length; i++) difference |= supplied.charCodeAt(i) ^ secret.charCodeAt(i);
  return difference === 0;
}

// Only errors known to precede provider acceptance are safe to retry automatically.
export class DeliveryRejected extends Error {}

export type Summary = { checked: number; sent: number; skipped: number; failed: number };
export type Claim = { key: string; token: string };
export type Dependencies = {
  applications(): Promise<Candidate[]>;
  interviews(): Promise<Candidate[]>;
  user(id: string): Promise<Recipient | null>;
  ownsApplication(id: string, userId: string): Promise<boolean>;
  claim(key: string, now: Date): Promise<Claim | null>;
  begin(claim: Claim): Promise<void>;
  current(kind: ReminderKind, candidate: Candidate): Promise<Candidate | null>;
  sent(claim: Claim): Promise<void>;
  release(claim: Claim): Promise<void>;
  send(email: string, subject: string, body: string, key: string): Promise<void>;
  diagnose(reason: string): void;
};

export async function runReminders(deps: Dependencies, now = new Date()): Promise<Summary> {
  const summary: Summary = { checked: 0, sent: 0, skipped: 0, failed: 0 };
  for (const kind of ["deadline", "interview"] as const) {
    let rows: Candidate[];
    try { rows = await (kind === "deadline" ? deps.applications() : deps.interviews()); }
    catch { summary.failed++; deps.diagnose("Unable to list " + kind + " records"); continue; }
    for (const row of rows) {
      summary.checked++;
      let claim: Claim | null = null;
      let sending = false;
      try {
        const user = await deps.user(row.userId);
        const due = eligible(kind, row, user, now);
        if (!due || (kind === "interview" && (!row.applicationId || !await deps.ownsApplication(row.applicationId, row.userId)))) {
          summary.skipped++; if (!occurrence(kind, row.date, row.time)) deps.diagnose("Invalid " + kind + " date/time skipped"); continue;
        }
        const key = [row.userId, kind, row.id, due.toISOString()].join(":");
        claim = await deps.claim(key, now);
        if (!claim) { summary.skipped++; continue; }
        // Recheck the live preferences and record ownership immediately before sending.
        const latest = await deps.user(row.userId);
        const current = await deps.current(kind, row);
        if (!current || current.userId !== row.userId || eligible(kind, current, latest, now)?.getTime() !== due.getTime() || (kind === "interview" && !await deps.ownsApplication(row.applicationId!, row.userId))) {
          await deps.release(claim); claim = null; summary.skipped++; continue;
        }
        const label = `${current.organisation} — ${current.title}`;
        const subject = kind === "deadline" ? "Application deadline reminder" : "Interview reminder";
        const body = `${subject}\n\n${label}\n${kind === "deadline" ? "Deadline" : "Interview date/time"}: ${formatAucklandTime(due)}\n\nLog in to your internship tracker to review the details.`;
        await deps.begin(claim);
        sending = true;
        await deps.send(latest!.email, subject, body, key);
        await deps.sent(claim);
        claim = null;
        summary.sent++;
      } catch (error) {
        summary.failed++; deps.diagnose("Reminder processing failed");
        if (claim && (!sending || error instanceof DeliveryRejected)) { try { await deps.release(claim); } catch { deps.diagnose("Claim release failed; lease will expire"); } }
      }
    }
  }
  return summary;
}
