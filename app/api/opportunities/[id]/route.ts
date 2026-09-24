import { studentOpportunityFilter } from "@/lib/opportunityAccess";
import { readJson } from "@/lib/apiValidation";
import { isObjectIdOrHexString } from "mongoose";
import { getAuthenticatedUser } from "@/lib/auth";
import { OpportunityModel } from "@/lib/models/Opportunity";
import { opportunityInputSchema, todayDate } from "@/lib/opportunity";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user)
      return Response.json({ message: "Please sign in." }, { status: 401 });
    if (user.role === "student")
      return Response.json({ message: "Permission denied." }, { status: 403 });
    const { id } = await params;
    if (!isObjectIdOrHexString(id))
      return Response.json(
        { message: "Invalid opportunity." },
        { status: 400 },
      );
    const input = opportunityInputSchema.safeParse(await readJson(request));
    if (!input.success)
      return Response.json(
        { message: input.error.issues[0].message },
        { status: 400 },
      );
    if (
      input.data.status === "Published" &&
      input.data.closingDate < todayDate()
    )
      return Response.json(
        {
          message: "Choose a current or future closing date before publishing.",
        },
        { status: 400 },
      );
    const row = await OpportunityModel.findOneAndUpdate(
      { _id: id, ...(user.role === "employee" ? { createdBy: user.id } : {}) },
      input.data,
      { returnDocument: "after", runValidators: true },
    );
    if (!row)
      return Response.json(
        { message: "Opportunity not found or permission denied." },
        { status: 404 },
      );
    return Response.json({ success: true, data: { id: String(row._id) } });
  } catch {
    return Response.json(
      { message: "Unable to update opportunity." },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user)
      return Response.json({ message: "Please sign in." }, { status: 401 });
    const { id } = await params;
    if (!isObjectIdOrHexString(id))
      return Response.json(
        { message: "Invalid opportunity." },
        { status: 400 },
      );
    const row = await OpportunityModel.findOne({
      _id: id,
      ...(user.role === "student"
        ? await studentOpportunityFilter()
        : user.role === "employee"
          ? { createdBy: user.id }
          : {}),
    }).lean();
    if (!row)
      return Response.json(
        { message: "Opportunity not found or permission denied." },
        { status: 404 },
      );
    const { ApplicationModel } = await import("@/lib/models/Application");
    const tracked =
      user.role === "student"
        ? await ApplicationModel.findOne({
            userId: user.id,
            opportunityId: id,
          }).select("_id")
        : null;
    return Response.json({
      success: true,
      data: {
        ...row,
        id: String(row._id),
        status:
          user.role === "student" && row.closingDate < todayDate()
            ? "Closed"
            : row.status,
        applicationId: tracked ? String(tracked._id) : undefined,
      },
    });
  } catch {
    return Response.json(
      { message: "Unable to load opportunity." },
      { status: 500 },
    );
  }
}
