import "server-only";
import { aiSchemas, type AIFeature } from "@/lib/ai-contract";
import { AIAssistantHistoryModel } from "@/lib/models/AIAssistantHistory";
import { connectToDatabase } from "@/lib/mongodb";

export async function saveAIHistory(
  userId: string,
  feature: AIFeature,
  result: unknown,
  model: string,
  applicationId?: string,
) {
  const parsed = aiSchemas[feature].parse(result);
  await connectToDatabase();
  const entry = await AIAssistantHistoryModel.create({
    userId,
    feature,
    result: parsed,
    model,
    ...(applicationId ? { applicationId } : {}),
  });
  return {
    id: String(entry._id),
    applicationId: entry.applicationId,
    feature,
    model,
    createdAt: entry.createdAt,
    result: parsed,
  };
}
