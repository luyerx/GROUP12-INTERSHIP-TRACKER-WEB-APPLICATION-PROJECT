import { handleAI } from "@/lib/ai-route";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) { return handleAI(request, "application-summary"); }
