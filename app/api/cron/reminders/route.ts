import { executeReminders } from "@/lib/notifications/runner";
import { cronAuthorized } from "@/lib/notifications/rules";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!cronAuthorized(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  try {
    const summary = await executeReminders();
    return Response.json({ success: true, ...summary }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Reminder cron failed before batch execution");
    return Response.json({ success: false, message: "Reminder job failed" }, { status: 500 });
  }
}
