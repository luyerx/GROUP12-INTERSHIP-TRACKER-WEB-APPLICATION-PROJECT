import { authorizeRole } from "@/lib/authorization";
import { connectToDatabase } from "@/lib/mongodb";
import { ResourceModel } from "@/lib/models/Resource";

export async function GET() {
  const authorization = await authorizeRole("student");
  if (!authorization.authorized) return authorization.response;

  await connectToDatabase();
  const resources = await ResourceModel.find({ status: "Published" }).sort({ featured: -1, updatedAt: -1 }).lean();
  return Response.json({ success: true, data: resources.map((resource) => ({ ...resource, id: String(resource._id) })) });
}