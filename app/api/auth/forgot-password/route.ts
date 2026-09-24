import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/mongodb";
import { PasswordResetTokenModel } from "@/lib/models/PasswordResetToken";
import { UserModel } from "@/lib/models/User";
import { sendReminderEmail } from "@/lib/notifications/email";
import { checkRateLimit, getClientIdentifier } from "@/lib/rateLimit";

const requestSchema = z.object({ email: z.string().trim().toLowerCase().max(160).pipe(z.email()) });
const temporaryFailure = () => NextResponse.json({ success: false, message: "Password recovery is temporarily unavailable. Please try again later." }, { status: 503 });

export async function POST(request: Request) {
  const rate = checkRateLimit("forgot:" + getClientIdentifier(request), 5, 15 * 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ success: false, message: "Too many requests. Please try again later." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });

  const input = requestSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ success: false, message: "Please enter a valid email address." }, { status: 400 });
  // Limit all addresses equally, including unknown and suspended accounts.
  const emailKey = crypto.createHash("sha256").update(input.data.email).digest("hex");
  const emailRate = checkRateLimit("forgot-email:" + emailKey, 3, 15 * 60 * 1000);
  if (!emailRate.allowed) return NextResponse.json({ success: false, message: "Too many requests. Please try again later." }, { status: 429, headers: { "Retry-After": String(emailRate.retryAfter) } });

  let tokenHash: string | undefined;
  try {
    // Never trust the request Host header when constructing recovery links.
    const base = new URL(process.env.APP_BASE_URL || "");
    if (base.username || base.password || base.search || base.hash || base.pathname !== "/" ||
        !["http:", "https:"].includes(base.protocol) ||
        (process.env.NODE_ENV === "production" && (base.protocol !== "https:" || ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)))) {
      return temporaryFailure();
    }
    if (!process.env.RESEND_API_KEY || !process.env.NOTIFICATION_FROM_EMAIL) return temporaryFailure();
    await connectToDatabase();
    const user = await UserModel.findOne({ email: input.data.email, status: { $ne: "Suspended" } });
    const rawToken = crypto.randomBytes(32).toString("hex");
    tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    if (user) {
      await PasswordResetTokenModel.deleteMany({ userId: user._id });
      // A failed or ambiguous delivery must never leave a usable token.
      await PasswordResetTokenModel.create({ tokenHash, userId: user._id, expiresAt, usable: false });
    }
    const resetUrl = new URL("/reset-password", base);
    resetUrl.searchParams.set("token", rawToken);
    // Use the same delivery path for every address: provider failures must not
    // reveal account existence. Ineligible addresses receive an inert link;
    // no token is stored for them and neither response nor email names a status.
    await sendReminderEmail(input.data.email, "Password reset — Internship Tracker",
      `If an eligible account exists for this email, use this link to reset your password:

${resetUrl.toString()}

This link expires in 30 minutes and can only be used once.
If you did not request a password reset, you can ignore this email.`,
      "password-reset:" + tokenHash);
    if (user) {
      const activated = await PasswordResetTokenModel.updateOne({ tokenHash, usable: false }, { $set: { usable: true } });
      if (activated.modifiedCount !== 1) return temporaryFailure();
    }
    return NextResponse.json({ success: true, message: "If an account exists for that email, password reset instructions have been sent." });
  } catch {
    if (tokenHash) {
      // Even if cleanup fails, a pending token remains unusable and TTL expires it.
      await PasswordResetTokenModel.deleteOne({ tokenHash }).catch(() => undefined);
    }
    return temporaryFailure();
  }
}
