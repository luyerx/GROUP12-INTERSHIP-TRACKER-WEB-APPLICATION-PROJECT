import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/User";
import { SessionModel } from "@/lib/models/Session";
import { checkRateLimit, getClientIdentifier } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(`login:${getClientIdentifier(request)}`, 10, 15 * 60 * 1000);
    if (!rate.allowed) return NextResponse.json({ success: false, message: "Too many login attempts. Please try again later." }, { status: 429, headers: { "Retry-After": String(rate.retryAfter) } });
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });

    if (typeof body.email !== "string" || typeof body.password !== "string") return NextResponse.json({ success: false, message: "Email and password are required." }, { status: 400 });
    const email = body.email.trim().toLowerCase();
    const password = body.password;
    const rememberMe = Boolean(body.rememberMe);

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required.",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await UserModel.findOne({
      email,
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    if (user.status === "Suspended") {
      return NextResponse.json({ success: false, message: "This account has been suspended." }, { status: 403 });
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    const token =
      crypto.randomBytes(32).toString("hex");

    const sessionDuration =
      rememberMe
        ? 30 * 24 * 60 * 60 * 1000
        : 24 * 60 * 60 * 1000;

    const expiresAt = new Date(
      Date.now() + sessionDuration
    );

    await SessionModel.create({
      token,
      userId: user._id,
      expiresAt,
    });

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set(
      "session_token",
      token,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
      }
    );

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to sign in.",
      },
      { status: 500 }
    );
  }
}