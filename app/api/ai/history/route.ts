import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { AIAssistantHistoryModel } from "@/lib/models/AIAssistantHistory";

const MAX_HISTORY_ITEMS = 8;

const historyBodySchema = z.object({
  applicationId: z.string().regex(/^[a-f\d]{24}$/i),
  feature: z.enum(["interview-prep", "application-insights"]),
  model: z.string().trim().max(120).default("gemini-3.5-flash"),
  result: z.object({}).passthrough().default({}),
});

const deleteBodySchema = z.object({
  id: z.string().optional(),
  clearAll: z.boolean().optional(),
}).refine((value) => value.id || value.clearAll !== undefined, {
  message: "Either id or clearAll is required.",
  path: ["id"],
});

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ success: false, message: "Not authenticated." }, { status: 401 });
    }

    await connectToDatabase();
    const entries = await AIAssistantHistoryModel.find({ userId: user.id }).sort({ createdAt: -1 }).limit(MAX_HISTORY_ITEMS).lean();

    return Response.json({
      success: true,
      history: entries.map((entry) => ({
        id: String(entry._id),
        userId: entry.userId,
        applicationId: entry.applicationId,
        feature: entry.feature,
        model: entry.model,
        createdAt: entry.createdAt,
        result: entry.result,
      })),
    });
  } catch (error) {
    console.error("AI history fetch error:", error);
    return Response.json({ success: false, message: "Unable to fetch AI history." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ success: false, message: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = historyBodySchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ success: false, message: "Invalid request payload." }, { status: 400 });
    }

    await connectToDatabase();

    const entry = await AIAssistantHistoryModel.create({
      userId: user.id,
      applicationId: parsed.data.applicationId,
      feature: parsed.data.feature,
      model: parsed.data.model,
      result: parsed.data.result,
    });

    return Response.json({
      success: true,
      history: {
        id: String(entry._id),
        userId: user.id,
        applicationId: entry.applicationId,
        feature: entry.feature,
        model: entry.model,
        createdAt: entry.createdAt,
        result: entry.result,
      },
    });
  } catch (error) {
    console.error("AI history save error:", error);
    return Response.json({ success: false, message: "Unable to save AI history." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ success: false, message: "Not authenticated." }, { status: 401 });
    }

    const payload = await request.json().catch(() => ({}));
    const parsed = deleteBodySchema.safeParse(payload);
    if (!parsed.success) {
      return Response.json({ success: false, message: "Invalid delete request." }, { status: 400 });
    }

    await connectToDatabase();

    if (parsed.data.clearAll) {
      await AIAssistantHistoryModel.deleteMany({ userId: user.id });
      return Response.json({ success: true, cleared: true });
    }

    if (parsed.data.id) {
      await AIAssistantHistoryModel.deleteOne({ _id: parsed.data.id, userId: user.id });
      return Response.json({ success: true, deleted: true });
    }

    return Response.json({ success: false, message: "Nothing to delete." }, { status: 400 });
  } catch (error) {
    console.error("AI history delete error:", error);
    return Response.json({ success: false, message: "Unable to delete AI history." }, { status: 500 });
  }
}
