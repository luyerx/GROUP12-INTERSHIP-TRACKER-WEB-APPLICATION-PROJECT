import { getAuthenticatedUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { AIAssistantHistoryModel } from "@/lib/models/AIAssistantHistory";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ success: false, message: "Not authenticated." }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();
    const entry = await AIAssistantHistoryModel.findOne({ _id: id, userId: user.id }).lean();

    if (!entry) {
      return Response.json({ success: false, message: "History item not found." }, { status: 404 });
    }

    return Response.json({
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
  } catch (error) {
    console.error("AI history detail error:", error);
    return Response.json({ success: false, message: "Unable to load AI history detail." }, { status: 500 });
  }
}
