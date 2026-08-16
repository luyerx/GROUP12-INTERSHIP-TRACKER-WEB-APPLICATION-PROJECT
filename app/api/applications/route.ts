import {
  applications,
  getNextApplicationId,
  isApplicationStatus,
  type Application,
} from "@/lib/applicationsStore";

export async function GET() {
  return Response.json({
    success: true,
    data: applications,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Organisation and role title are required.
    if (!body.organisation || !body.roleTitle) {
      return Response.json(
        {
          success: false,
          message: "Organisation and role title are required.",
        },
        { status: 400 }
      );
    }

    // Validate the application status.
    const status = body.status || "Interested";

    if (!isApplicationStatus(status)) {
      return Response.json(
        {
          success: false,
          message: "Invalid application status.",
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const newApplication: Application = {
      id: getNextApplicationId(),

      organisation: body.organisation,
      roleTitle: body.roleTitle,

      location: body.location || "",
      sourceLink: body.sourceLink || "",
      deadline: body.deadline || "",
      status,

      jobDescription: body.jobDescription || "",
      contactPerson: body.contactPerson || "",
      outcome: body.outcome || "",
      notes: body.notes || "",

      createdAt: now,
      updatedAt: now,
    };

    applications.push(newApplication);

    return Response.json(
      {
        success: true,
        message: "Application created successfully.",
        data: newApplication,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create application:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to create application.",
      },
      { status: 500 }
    );
  }
}