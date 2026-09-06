import "server-only";

import { cookies } from "next/headers";

import { connectToDatabase } from "@/lib/mongodb";
import { SessionModel } from "@/lib/models/Session";
import { UserModel } from "@/lib/models/User";

export type AuthenticatedUser = {
  id: string;
  fullName: string;
  email: string;
  role: "student" | "admin";
};

export async function getAuthenticatedUser():
  Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("session_token")?.value;

  if (!token) {
    return null;
  }

  await connectToDatabase();

  const session = await SessionModel.findOne({
    token,
    expiresAt: {
      $gt: new Date(),
    },
  });

  if (!session) {
    return null;
  }

  const user = await UserModel.findById(
    session.userId
  );

  if (!user) {
    return null;
  }

  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    role:
      user.role === "admin"
        ? "admin"
        : "student",
  };
}