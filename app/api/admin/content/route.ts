import { z } from "zod";

import { authorizeRole } from "@/lib/authorization";
import { connectToDatabase } from "@/lib/mongodb";
import { OpportunityModel } from "@/lib/models/Opportunity";
import { ResourceModel } from "@/lib/models/Resource";

const resourceSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).default(""),
  category: z.string().trim().min(1).max(120),
  type: z.enum(["Guide", "Article", "Video", "Template"]),
  featured: z.boolean().default(false),
  source: z.string().trim().max(160).default("Internship Tracker"),
  url: z.string().trim().max(2000).default(""),
  status: z.enum(["Published", "Draft"]),
});

const opportunitySchema = z.object({
  organisation: z.string().trim().min(1).max(160),
  role: z.string().trim().min(1).max(200),
  location: z.string().trim().min(1).max(160),
  closingDate: z.string().trim().min(1).max(80),
  status: z.enum(["Published", "Draft", "Closed"]),
  applications: z.number().int().min(0).default(0),
});

function getKind(request: Request) {
  return new URL(request.url).searchParams.get("kind");
}

export async function GET(request: Request) {
  const authorization = await authorizeRole("admin");
  if (!authorization.authorized) return authorization.response;
  await connectToDatabase();

  const kind = getKind(request);
  const rows = kind === "resources"
    ? await ResourceModel.find().sort({ updatedAt: -1 }).lean()
    : await OpportunityModel.find().sort({ updatedAt: -1 }).lean();

  return Response.json({ success: true, data: rows.map((row) => ({
    ...row,
    id: String(row._id),
    updated: new Date(row.updatedAt).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" }),
  })) });
}

export async function POST(request: Request) {
  const authorization = await authorizeRole("admin");
  if (!authorization.authorized) return authorization.response;

  const kind = getKind(request);
  const input = kind === "resources"
    ? resourceSchema.safeParse(await request.json())
    : opportunitySchema.safeParse(await request.json());

  if (!input.success) return Response.json({ success: false, message: input.error.issues[0].message }, { status: 400 });
  await connectToDatabase();
  const row = kind === "resources"
    ? await ResourceModel.create(input.data)
    : await OpportunityModel.create(input.data);

  return Response.json({ success: true, data: { ...row.toObject(), id: String(row._id) } }, { status: 201 });
}