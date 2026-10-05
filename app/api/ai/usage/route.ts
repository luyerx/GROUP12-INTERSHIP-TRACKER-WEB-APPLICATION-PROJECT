import { authorizeRole } from "@/lib/authorization";
import { getAIUsageSummary } from "@/lib/ai-cooldown";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await authorizeRole("student");
    if (!auth.authorized) return auth.response;
    const user = auth.user;

    const usage = getAIUsageSummary(user.id);
    return NextResponse.json({
      success: true,
      usage,
    });
  } catch {
    return NextResponse.json({ success: false, message: "Unable to fetch AI usage." }, { status: 500 });
  }
}
