import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { accountPasswordError, PASSWORD_HASH_ROUNDS } from "@/lib/accountPassword";
import { connectToDatabase } from "@/lib/mongodb";
import { PasswordResetTokenModel } from "@/lib/models/PasswordResetToken";
import { SessionModel } from "@/lib/models/Session";
import { UserModel } from "@/lib/models/User";
import { checkRateLimit, getClientIdentifier } from "@/lib/rateLimit";

const resetSchema = z.object({ token: z.string().trim().regex(/^[a-f0-9]{64}$/), password: z.string() });
class InvalidReset extends Error {}

export async function POST(request: Request) {
  const rate = checkRateLimit("reset:" + getClientIdentifier(request), 10, 15 * 60 * 1000);
  if (!rate.allowed) return NextResponse.json({ success: false, message: "Too many requests. Please try again later." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
  const input = resetSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ success: false, message: "A valid token and password are required." }, { status: 400 });
  const passwordError = accountPasswordError(input.data.password);
  if (passwordError) return NextResponse.json({ success: false, message: passwordError }, { status: 400 });

  try {
    const db = await connectToDatabase();
    const tokenHash = crypto.createHash("sha256").update(input.data.token).digest("hex");
    await db.connection.transaction(async session => {
      // Deletion is the atomic claim. A competing transaction cannot consume
      // the same token; on retry it sees no token. Any failure rolls back all writes.
      const resetToken = await PasswordResetTokenModel.findOneAndDelete({ tokenHash, usable: true, expiresAt: { $gt: new Date() } }, { session });
      if (!resetToken) throw new InvalidReset("This reset link is invalid or expired.");
      const user = await UserModel.findOne({ _id: resetToken.userId, status: { $ne: "Suspended" } }).session(session);
      if (!user) throw new InvalidReset("This reset link is invalid or expired.");
      if (await bcrypt.compare(input.data.password, user.passwordHash)) {
        throw new InvalidReset("New password cannot be the same as your current password.");
      }
      user.passwordHash = await bcrypt.hash(input.data.password, PASSWORD_HASH_ROUNDS);
      await user.save({ session });
      await SessionModel.deleteMany({ userId: user._id }, { session });
      await PasswordResetTokenModel.deleteMany({ userId: user._id }, { session });
    }, { maxCommitTimeMS: 10_000 });
    return NextResponse.json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    if (error instanceof InvalidReset) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    return NextResponse.json({ success: false, message: "Unable to reset password. Please try again later." }, { status: 503 });
  }
}
