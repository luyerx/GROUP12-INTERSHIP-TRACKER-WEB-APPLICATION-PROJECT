import "server-only";
import { createHash } from "crypto";
import { DeliveryRejected } from "@/lib/notifications/rules";

export async function sendReminderEmail(to: string, subject: string, text: string, key: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  if (!apiKey || !from) throw new DeliveryRejected("Reminder email provider is not configured");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": createHash("sha256").update(key).digest("hex") },
      body: JSON.stringify({ from, to: [to], subject, text }),
      signal: controller.signal,
    });
    if (!response.ok) {
      // Network failures, timeouts and server failures may follow acceptance.
      // Keep those deliveries blocked for reconciliation instead of sending twice.
      const Rejection = [400, 401, 403, 404, 422, 429].includes(response.status) ? DeliveryRejected : Error;
      throw new Rejection(`Email provider returned HTTP ${response.status}`);
    }
  } finally { clearTimeout(timeout); }
}
