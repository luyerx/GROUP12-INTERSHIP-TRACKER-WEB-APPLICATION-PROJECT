import { validObjectId, invalidIdResponse } from "@/lib/apiValidation";
import { readJson } from "@/lib/apiValidation";
import { applicationInputSchema } from "@/lib/application";
import { applicationApiError, applicationNotFound } from "@/lib/applicationApi";
import { updateApplicationStatus } from "@/lib/applicationsRepository";
import { authorizeRole } from "@/lib/authorization";

const statusSchema = applicationInputSchema.pick({ status: true }).required();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authorization = await authorizeRole("student");
    if (!authorization.authorized) return authorization.response;
    const { id } = await params;
    if (!validObjectId(id)) return invalidIdResponse();
    const input = statusSchema.safeParse(await readJson(request));
    if (!input.success) {
      return Response.json({ success: false, message: "Invalid application status." }, { status: 400 });
    }
    const data = await updateApplicationStatus(id, authorization.user.id, input.data.status);
    if (!data) return applicationNotFound();
    return Response.json({ success: true, message: "Application status updated successfully.", data });
  } catch (error) {
    return applicationApiError(error);
  }
}
