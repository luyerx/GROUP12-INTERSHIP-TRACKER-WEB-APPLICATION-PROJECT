import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { accountPasswordError, PASSWORD_HASH_ROUNDS } from "@/lib/accountPassword";

import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/lib/models/User";
import { checkRateLimit, getClientIdentifier } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(
      `register:${getClientIdentifier(request)}`,
      5,
      60 * 60 * 1000,
    );
    if (!rate.allowed)
      return NextResponse.json(
        {
          success: false,
          message: "Too many registration attempts. Please try again later.",
        },
        { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
      );
    const body = await request.json();

    if (
      typeof body.fullName !== "string" ||
      typeof body.email !== "string" ||
      typeof body.password !== "string"
    )
      return NextResponse.json(
        { success: false, message: "Please provide valid account details." },
        { status: 400 },
      );
    const role = body.role ?? "student";
    if (!["student", "employee"].includes(role))
      return NextResponse.json(
        {
          success: false,
          message: "Admin access is granted by an existing administrator.",
        },
        { status: 403 },
      );
    const fullName = body.fullName.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Full name, email and password are required.",
        },
        { status: 400 },
      );
    }

    if (
      fullName.length > 120 ||
      email.length > 160 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    )
      return NextResponse.json(
        {
          success: false,
          message:
            "Use a valid name, email, and password of at most 72 characters.",
        },
        { status: 400 },
      );

    const passwordError = accountPasswordError(password);
    if (passwordError) {
      return NextResponse.json(
        {
          success: false,
          message: passwordError,
        },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const existingUser = await UserModel.findOne({
      email,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);

    const user = await UserModel.create({
      fullName,
      email,
      passwordHash,
      role,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user: {
          id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Register error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create account.",
      },
      { status: 500 },
    );
  }
}
