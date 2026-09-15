import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/mongodb";
import { PasswordResetTokenModel } from "@/lib/models/PasswordResetToken";
import { SessionModel } from "@/lib/models/Session";
import { UserModel } from "@/lib/models/User";

const resetSchema = z.object({ token: z.string().trim().min(1), password: z.string().min(8) });

export async function POST(request: Request) {
  const input = resetSchema.safeParse(await request.json());
  if (!input.success) return NextResponse.json({ success: false, message: "A valid token and password are required." }, { status: 400 });

  await connectToDatabase();
  const tokenHash = crypto.createHash("sha256").update(input.data.token).digest("hex");
  const resetToken = await PasswordResetTokenModel.findOne({ tokenHash, expiresAt: { $gt: new Date() } });
  if (!resetToken) return NextResponse.json({ success: false, message: "This reset link is invalid or expired." }, { status: 400 });

  const user = await UserModel.findById(resetToken.userId);
  if (!user) return NextResponse.json({ success: false, message: "This reset link is invalid or expired." }, { status: 400 });
  if (await bcrypt.compare(input.data.password, user.passwordHash)) {
    return NextResponse.json({ success: false, message: "New password cannot be the same as your current password." }, { status: 400 });
  }

  await UserModel.findByIdAndUpdate(resetToken.userId, { passwordHash: await bcrypt.hash(input.data.password, 10) });
  await SessionModel.deleteMany({ userId: resetToken.userId });
  await PasswordResetTokenModel.deleteOne({ _id: resetToken._id });
  return NextResponse.json({ success: true, message: "Password reset successfully." });
}