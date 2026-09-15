import "server-only";

import { NextResponse } from "next/server";

import { getAuthenticatedUser, type AuthenticatedUser } from "@/lib/auth";

export type UserRole = "student" | "admin" | "employee" | "superadmin";

type AuthorizedResult = {
  authorized: true;
  user: AuthenticatedUser;
};

type UnauthorizedResult = {
  authorized: false;
  response: NextResponse;
};

export async function authorizeRole(
  requiredRole: UserRole,
): Promise<AuthorizedResult | UnauthorizedResult> {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            success: false,
            message: "Authentication required.",
          },
          { status: 401 },
        ),
      };
    }

    if (user.role !== requiredRole && !(requiredRole === "admin" && user.role === "superadmin")) {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            success: false,
            message: "You do not have permission to perform this action.",
          },
          { status: 403 },
        ),
      };
    }

    return {
      authorized: true,
      user,
    };
  } catch (error) {
    console.error("Authorization error:", error);

    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Unable to verify user permissions.",
        },
        { status: 500 },
      ),
    };
  }
}
