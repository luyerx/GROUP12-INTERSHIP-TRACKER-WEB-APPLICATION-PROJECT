import { isObjectIdOrHexString } from "mongoose";
import { authorizeRole } from "@/lib/authorization";
import { OpportunityModel } from "@/lib/models/Opportunity";
import { ApplicationModel } from "@/lib/models/Application";
import { todayDate } from "@/lib/opportunity";
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authorizeRole("student");
    if (!auth.authorized) return auth.response;
    const { id } = await params;
    if (!isObjectIdOrHexString(id))
      return Response.json(
        { message: "Invalid opportunity." },
        { status: 400 },
      );
    const existing = await ApplicationModel.findOne({
      userId: auth.user.id,
      opportunityId: id,
    });
    if (existing)
      return Response.json({
        success: true,
        data: { id: String(existing._id) },
      });
    const opportunity = await OpportunityModel.findOne({
      _id: id,
      status: "Published",
      closingDate: { $gte: todayDate() },
    });
    if (!opportunity)
      return Response.json(
        { message: "This opportunity is no longer available for tracking." },
        { status: 409 },
      );
    // Deterministic document identity prevents duplicate tracking even before index creation.
    const { createHash } = await import("node:crypto");
    const applicationId = createHash("sha256")
      .update(auth.user.id + ":" + id)
      .digest("hex")
      .slice(0, 24);
    await ApplicationModel.updateOne(
      { _id: applicationId },
      {
        $setOnInsert: {
          userId: auth.user.id,
          opportunityId: id,
          organisation: opportunity.organisation,
          roleTitle: opportunity.role,
          location: opportunity.location,
          deadline: opportunity.closingDate,
          sourceLink: opportunity.applicationUrl || "",
          jobDescription: opportunity.description || "",
          status: "Interested",
        },
      },
      { upsert: true, runValidators: true },
    );
    return Response.json(
      { success: true, data: { id: applicationId } },
      { status: 201 },
    );
  } catch {
    return Response.json(
      { message: "Unable to track opportunity. Please retry." },
      { status: 500 },
    );
  }
}
