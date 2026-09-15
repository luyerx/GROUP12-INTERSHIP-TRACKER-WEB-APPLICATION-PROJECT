import { applicationInputSchema } from "@/lib/application";
import { applicationApiError, applicationNotFound } from "@/lib/applicationApi";
import { getApplication, updateApplication, deleteApplication } from "@/lib/applicationsRepository";
import { authorizeRole } from "@/lib/authorization";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    const authorization = await authorizeRole("student");
    if (!authorization.authorized) return authorization.response;
    const { id } = await params;
    const data = await getApplication(id, authorization.user.id);
    if (!data) return applicationNotFound();
    return Response.json({ success: true, data });
  } catch (error) {
    return applicationApiError(error);
  }
}

export async function PUT(request: Request, { params }: Context) {
  try {
    const authorization = await authorizeRole("student");
    if (!authorization.authorized) return authorization.response;
    const { id } = await params;
    const input = applicationInputSchema.safeParse(await request.json());
    if (!input.success) {
      return Response.json({ success: false, message: input.error.issues[0].message }, { status: 400 });
    }
    const existing = await getApplication(id, authorization.user.id);
    if (!existing) return applicationNotFound();
    if (existing.opportunityId) {
      const officialFields = ["organisation", "roleTitle", "location", "jobDescription", "deadline", "sourceLink"] as const;
      if (officialFields.some((field) => input.data[field] !== existing[field])) {
        return Response.json({ success: false, message: "Opportunity information is managed by the employer or admin." }, { status: 403 });
      }
    }
    const data = await updateApplication(id, authorization.user.id, input.data);
    if (!data) return applicationNotFound();
    return Response.json({ success: true, message: "Application updated successfully.", data });
  } catch (error) {
    return applicationApiError(error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const authorization = await authorizeRole("student");
    if (!authorization.authorized)return authorization.response;
    const { id } = await params;
    const data = await deleteApplication(id, authorization.user.id);
    if (!data) return applicationNotFound();
    return Response.json({ success: true, message: "Application deleted successfully.", data });
  } catch (error) {
    return applicationApiError(error);
  }
}
