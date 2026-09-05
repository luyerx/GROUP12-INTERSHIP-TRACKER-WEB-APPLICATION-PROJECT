import { NextRequest, NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { SessionModel } from "@/lib/models/Session";
import { UserModel } from "@/lib/models/User";

export async function GET(request: NextRequest) {
  try {
    const token =
      request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const session = await SessionModel.findOne({
      token,
      expiresAt: {
        $gt: new Date(),
      },
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Session is invalid or expired.",
        },
        { status: 401 }
      );
    }

    const user = await UserModel.findById(
      session.userId
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Current user error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load current user.",
      },
      { status: 500 }
    );
  }
}