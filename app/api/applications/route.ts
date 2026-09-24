import { readJson } from "@/lib/apiValidation";
import { applicationInputSchema } from "@/lib/application";
import { applicationApiError } from "@/lib/applicationApi";
import { createApplication, listApplications } from "@/lib/applicationsRepository";
import { authorizeRole } from "@/lib/authorization";

export async function GET() {
  try {
    const authorization = await authorizeRole("student");
    if (!authorization.authorized) return authorization.response;
    return Response.json({ success: true, data: await listApplications(authorization.user.id) });
  } catch (error) {
    return applicationApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const authorization = await authorizeRole("student");
    if (!authorization.authorized) return authorization.response;
    const input = applicationInputSchema.safeParse(await readJson(request));
    if (!input.success) {
      return Response.json({ success: false, message: input.error.issues[0].message }, { status: 400 });
    }
    const data = await createApplication(authorization.user.id, input.data);
    return Response.json({ success: true, message: "Application created successfully.", data }, { status: 201 });
  } catch (error) {
    return applicationApiError(error);
  }
}
