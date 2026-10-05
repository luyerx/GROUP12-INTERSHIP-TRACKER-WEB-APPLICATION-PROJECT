import { authorizeRole } from "@/lib/authorization";
import { connectToDatabase } from "@/lib/mongodb";
import { AIAssistantHistoryModel } from "@/lib/models/AIAssistantHistory";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorizeRole("student");
    if (!auth.authorized) return auth.response;
    const user = auth.user;

    const { id } = await params;
    if (!/^[a-f\d]{24}$/i.test(id)) return json({ success: false, message: "Invalid history ID." }, { status: 400 });
    await connectToDatabase();
    const entry = await AIAssistantHistoryModel.findOne({ _id: id, userId: user.id }).lean();

    if (!entry) {
      return json({ success: false, message: "History item not found." }, { status: 404 });
    }

    return json({
      success: true,
      item: {
        id: String(entry._id),
        applicationId: entry.applicationId,
        feature: entry.feature,
        model: entry.model,
        createdAt: entry.createdAt,
        result: entry.result,
      },
    });
  } catch {
    return json({ success: false, message: "Unable to load AI history detail." }, { status: 500 });
  }
}

function json(body: unknown, init?: ResponseInit) { return Response.json(body, { ...init, headers: { "Cache-Control": "no-store" } }); }
