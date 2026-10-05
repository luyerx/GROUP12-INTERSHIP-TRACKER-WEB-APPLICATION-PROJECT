import { z } from "zod";
import { authorizeRole } from "@/lib/authorization";
import { connectToDatabase } from "@/lib/mongodb";
import { AIAssistantHistoryModel } from "@/lib/models/AIAssistantHistory";
import { aiSchemas } from "@/lib/ai-contract";
import { getApplication } from "@/lib/applicationsRepository";
import { hasOutcomeClaim } from "@/lib/ai-safety";

const MAX_HISTORY_ITEMS = 8;

const historyBodySchema = z.object({
  applicationId: z.string().regex(/^[a-f\d]{24}$/i),
  feature: z.enum(["interview-prep", "application-insights"]),
  model: z.enum(["gemini-3.5-flash", "gemini-3.5-flash-lite"]).default("gemini-3.5-flash"),
  result: z.unknown(),
}).strict();

const deleteBodySchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  clearAll: z.boolean().optional(),
}).strict().refine((value) => Boolean(value.id) !== (value.clearAll === true), {
  message: "Either id or clearAll is required.",
  path: ["id"],
});

export async function GET() {
  try {
    const auth = await authorizeRole("student");
    if (!auth.authorized) return auth.response;
    const user = auth.user;

    await connectToDatabase();
    const entries = await AIAssistantHistoryModel.find({ userId: user.id }).sort({ createdAt: -1 }).limit(MAX_HISTORY_ITEMS).lean();

    return json({
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
  } catch {
    return json({ success: false, message: "Unable to fetch AI history." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorizeRole("student");
    if (!auth.authorized) return auth.response;
    const user = auth.user;

    // Legacy clients may still save the two original tools. New tools are saved
    // by the generation route only, preventing arbitrary document uploads here.
    const body = await readBoundedBody(request);
    const parsed = historyBodySchema.safeParse(body);
    if (!parsed.success) {
      return json({ success: false, message: "Invalid request payload." }, { status: 400 });
    }
    const application = await getApplication(parsed.data.applicationId, user.id);
    if (!application) return json({ success: false, message: "Application not found." }, { status: 404 });
    const result = aiSchemas[parsed.data.feature].safeParse(parsed.data.result);
    if (!result.success || hasOutcomeClaim(result.data)) return json({ success: false, message: "Invalid guidance." }, { status: 400 });

    await connectToDatabase();

    const entry = await AIAssistantHistoryModel.create({
      userId: user.id,
      applicationId: parsed.data.applicationId,
      feature: parsed.data.feature,
      model: parsed.data.model,
      result: result.data,
    });

    return json({
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
  } catch {
    return json({ success: false, message: "Unable to save AI history." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await authorizeRole("student");
    if (!auth.authorized) return auth.response;
    const user = auth.user;

    const payload = await readBoundedBody(request);
    const parsed = deleteBodySchema.safeParse(payload);
    if (!parsed.success) {
      return json({ success: false, message: "Invalid delete request." }, { status: 400 });
    }

    await connectToDatabase();

    if (parsed.data.clearAll) {
      await AIAssistantHistoryModel.deleteMany({ userId: user.id });
      return json({ success: true, cleared: true });
    }

    if (parsed.data.id) {
      const deleted = await AIAssistantHistoryModel.deleteOne({ _id: parsed.data.id, userId: user.id });
      if (!deleted.deletedCount) return json({ success: false, message: "History item not found." }, { status: 404 });
      return json({ success: true, deleted: true });
    }

    return json({ success: false, message: "Nothing to delete." }, { status: 400 });
  } catch {
    return json({ success: false, message: "Unable to delete AI history." }, { status: 500 });
  }
}

async function readBoundedBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const timer = setTimeout(() => { void reader.cancel().catch(() => {}); }, 5000);
  try {
    let text = "", bytes = 0;
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 60000) { void reader.cancel().catch(() => {}); return null; }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch { return null; }
  finally { clearTimeout(timer); reader.releaseLock(); }
}

function json(body: unknown, init?: ResponseInit) { return Response.json(body, { ...init, headers: { "Cache-Control": "no-store" } }); }
