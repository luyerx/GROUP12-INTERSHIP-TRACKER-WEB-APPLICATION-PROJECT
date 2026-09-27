import { getAuthenticatedUser } from "@/lib/auth";
import { getAIUsageSummary } from "@/lib/ai-cooldown";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Not authenticated." }, { status: 401 });
    }

    const usage = getAIUsageSummary(user.id);
    return NextResponse.json({
      success: true,
      usage,
    });
  } catch (error) {
    console.error("AI usage fetch error:", error);
    return NextResponse.json({ success: false, message: "Unable to fetch AI usage." }, { status: 500 });
  }
}
