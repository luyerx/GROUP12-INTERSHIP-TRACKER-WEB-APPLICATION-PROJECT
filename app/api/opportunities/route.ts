import { readJson } from "@/lib/apiValidation";
import { getAuthenticatedUser } from "@/lib/auth";
import { listOpportunities } from "@/lib/opportunitiesRepository";
import { opportunityInputSchema, todayDate } from "@/lib/opportunity";
import { OpportunityModel } from "@/lib/models/Opportunity";
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user)
      return Response.json({ message: "Please sign in." }, { status: 401 });
    return Response.json({
      success: true,
      data: await listOpportunities(user),
    });
  } catch {
    return Response.json(
      { message: "Unable to load opportunities. Please retry." },
      { status: 500 },
    );
  }
}
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user)
      return Response.json({ message: "Please sign in." }, { status: 401 });
    if (user.role !== "employee")
      return Response.json(
        {
          success: false,
          message:
            "Only Active Employee accounts can create opportunities. Admin accounts manage existing Employee listings.",
        },
        { status: 403 },
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
    const row = await OpportunityModel.create({
      ...input.data,
      createdBy: user.id,
    });
    return Response.json(
      { success: true, data: { id: String(row._id) } },
      { status: 201 },
    );
  } catch {
    return Response.json(
      { message: "Unable to create opportunity." },
      { status: 500 },
    );
  }
}
