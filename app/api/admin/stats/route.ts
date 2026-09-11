import { authorizeRole } from "@/lib/authorization";
import { connectToDatabase } from "@/lib/mongodb";
import { ApplicationModel } from "@/lib/models/Application";

export async function GET() {
  const authorization = await authorizeRole("admin");
  if (!authorization.authorized) return authorization.response;

  await connectToDatabase();
  const applications = await ApplicationModel.countDocuments();

  return Response.json({
    success: true,
    data: { applications },
  });
}