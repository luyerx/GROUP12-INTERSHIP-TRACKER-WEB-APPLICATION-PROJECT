import { NextRequest, NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { SessionModel } from "@/lib/models/Session";

export async function POST(request: NextRequest) {
  try {
    const token =
      request.cookies.get("session_token")?.value;

    if (token) {
      await connectToDatabase();

      await SessionModel.deleteOne({
        token,
      });
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });

    response.cookies.set(
      "session_token",
      "",
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: new Date(0),
      }
    );

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to log out.",
      },
      { status: 500 }
    );
  }
}