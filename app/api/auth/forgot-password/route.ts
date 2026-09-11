import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/mongodb";
import { PasswordResetTokenModel } from "@/lib/models/PasswordResetToken";
import { UserModel } from "@/lib/models/User";
import { checkRateLimit, getClientIdentifier } from "@/lib/rateLimit";

const requestSchema = z.object({ email: z.email().trim().toLowerCase() });

export async function POST(request: Request) {
  const rate = checkRateLimit(`forgot:${getClientIdentifier(request)}`, 5, 15 * 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ success: false, message: "Too many requests. Please try again later." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });

  const input = requestSchema.safeParse(await request.json());
  if (!input.success) return NextResponse.json({ success: false, message: "Please enter a valid email address." }, { status: 400 });

  await connectToDatabase();
  const user = await UserModel.findOne({ email: input.data.email });
  let resetUrl: string | undefined;

  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    await PasswordResetTokenModel.deleteMany({ userId: user._id });
    await PasswordResetTokenModel.create({ tokenHash, userId: user._id, expiresAt: new Date(Date.now() + 30 * 60 * 1000) });
    if (process.env.NODE_ENV !== "production") resetUrl = `/reset-password?token=${rawToken}`;
  }

  return NextResponse.json({
    success: true,
    message: "If an account exists for that email, reset instructions have been created.",
    ...(resetUrl ? { resetUrl } : {}),
  });
}