import { z } from "zod";

import { authorizeRole } from "@/lib/authorization";
import { connectToDatabase } from "@/lib/mongodb";
import { OpportunityModel } from "@/lib/models/Opportunity";
import { ResourceModel } from "@/lib/models/Resource";

const resourceSchema = z.object({
  title: z.string().trim().min(1).max(200), description: z.string().trim().max(2000),
  category: z.string().trim().min(1).max(120), type: z.enum(["Guide", "Article", "Video", "Template"]),
  featured: z.boolean(), source: z.string().trim().max(160), url: z.string().trim().max(2000), status: z.enum(["Published", "Draft"]),
});
const opportunitySchema = z.object({
  organisation: z.string().trim().min(1).max(160), role: z.string().trim().min(1).max(200), location: z.string().trim().min(1).max(160),
  closingDate: z.iso.date(), status: z.enum(["Published", "Draft", "Closed"]),
});

function getKind(request: Request) {
  const kind = new URL(request.url).searchParams.get("kind");
  return kind === "resources" || kind === "opportunities" ? kind : null;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeRole("admin");
  if (!authorization.authorized) return authorization.response;
  const { id } = await params;
  const kind = getKind(request);
  if (!kind) return Response.json({ success: false, message: "A valid content kind is required." }, { status: 400 });
  const input = kind === "resources" ? resourceSchema.safeParse(await request.json()) : opportunitySchema.safeParse(await request.json());
  if (!input.success) return Response.json({ success: false, message: input.error.issues[0].message }, { status: 400 });
  await connectToDatabase();
  const row = kind === "resources"
    ? await ResourceModel.findByIdAndUpdate(id, input.data, { new: true, runValidators: true }).lean()
    : await OpportunityModel.findByIdAndUpdate(id, input.data, { new: true, runValidators: true }).lean();
  if (!row) return Response.json({ success: false, message: "Content not found." }, { status: 404 });
  return Response.json({ success: true, data: { ...row, id: String(row._id) } });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeRole("admin");
  if (!authorization.authorized) return authorization.response;
  const { id } = await params;
  const kind = getKind(request);
  if (!kind) return Response.json({ success: false, message: "A valid content kind is required." }, { status: 400 });
  await connectToDatabase();
  const row = kind === "resources" ? await ResourceModel.findByIdAndDelete(id).lean() : await OpportunityModel.findByIdAndDelete(id).lean();
  if (!row) return Response.json({ success: false, message: "Content not found." }, { status: 404 });
  return Response.json({ success: true });
}