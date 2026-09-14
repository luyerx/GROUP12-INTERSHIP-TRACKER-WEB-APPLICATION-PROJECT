import { z } from "zod";
import { opportunityInputSchema } from "@/lib/opportunity";

import { authorizeRole } from "@/lib/authorization";
import { connectToDatabase } from "@/lib/mongodb";
import { OpportunityModel } from "@/lib/models/Opportunity";
import { ResourceModel } from "@/lib/models/Resource";
import { ApplicationModel } from "@/lib/models/Application";

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

const opportunitySchema = opportunityInputSchema;

function getKind(request: Request) {
  const kind = new URL(request.url).searchParams.get("kind");
  return kind === "resources" || kind === "opportunities" ? kind : null;
}

export async function GET(request: Request) {
  const authorization = await authorizeRole("admin");
  if (!authorization.authorized) return authorization.response;
  const kind = getKind(request);
  if (!kind)
    return Response.json(
      { success: false, message: "A valid content kind is required." },
      { status: 400 },
    );
  await connectToDatabase();

  if (kind === "resources") {
    const rows = await ResourceModel.find().sort({ updatedAt: -1 }).lean();
    return Response.json({
      success: true,
      data: rows.map((row) => ({
        ...row,
        id: String(row._id),
        updated: new Date(row.updatedAt).toLocaleDateString("en-NZ", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      })),
    });
  }

  const [rows, applicationCounts] = await Promise.all([
    OpportunityModel.find().sort({ updatedAt: -1 }).lean(),
    ApplicationModel.aggregate([
      { $group: { _id: "$opportunityId", applications: { $sum: 1 } } },
    ]),
  ]);
  const countByOpportunity = new Map(
    applicationCounts.map((item) => [String(item._id), item.applications]),
  );

  return Response.json({
    success: true,
    data: rows.map((row) => ({
      ...row,
      id: String(row._id),
      applications: countByOpportunity.get(String(row._id)) || 0,
      updated: new Date(row.updatedAt).toLocaleDateString("en-NZ", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    })),
  });
}

export async function POST(request: Request) {
  const authorization = await authorizeRole("admin");
  if (!authorization.authorized) return authorization.response;

  const kind = getKind(request);
  if (!kind)
    return Response.json(
      { success: false, message: "A valid content kind is required." },
      { status: 400 },
    );
  const input =
    kind === "resources"
      ? resourceSchema.safeParse(await request.json())
      : opportunitySchema.safeParse(await request.json());

  if (!input.success)
    return Response.json(
      { success: false, message: input.error.issues[0].message },
      { status: 400 },
    );
  await connectToDatabase();
  const row =
    kind === "resources"
      ? await ResourceModel.create(input.data)
      : await OpportunityModel.create({
          ...input.data,
          createdBy: authorization.user.id,
        });

  return Response.json(
    { success: true, data: { ...row.toObject(), id: String(row._id) } },
    { status: 201 },
  );
}
