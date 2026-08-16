import {
  applications,
  isApplicationStatus,
} from "@/lib/applicationsStore";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const applicationId = Number(id);

  const application = applications.find(
    (item) => item.id === applicationId
  );

  if (!application) {
    return Response.json(
      {
        success: false,
        message: "Application not found.",
      },
      { status: 404 }
    );
  }

  return Response.json({
    success: true,
    data: application,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const applicationId = Number(id);

    const application = applications.find(
      (item) => item.id === applicationId
    );

    if (!application) {
      return Response.json(
        {
          success: false,
          message: "Application not found.",
        },
        { status: 404 }
      );
    }

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

    const status = body.status || application.status;

    // Reject unknown application statuses.
    if (!isApplicationStatus(status)) {
      return Response.json(
        {
          success: false,
          message: "Invalid application status.",
        },
        { status: 400 }
      );
    }

    application.organisation = body.organisation;
    application.roleTitle = body.roleTitle;

    application.location = body.location || "";
    application.sourceLink = body.sourceLink || "";
    application.deadline = body.deadline || "";
    application.status = status;

    application.jobDescription = body.jobDescription || "";
    application.contactPerson = body.contactPerson || "";
    application.outcome = body.outcome || "";
    application.notes = body.notes || "";

    // Keep createdAt unchanged but update the modification time.
    application.updatedAt = new Date().toISOString();

    return Response.json({
      success: true,
      message: "Application updated successfully.",
      data: application,
    });
  } catch (error) {
    console.error("Failed to update application:", error);

    return Response.json(
      {
        success: false,
        message: "Failed to update application.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const applicationId = Number(id);

  const applicationIndex = applications.findIndex(
    (item) => item.id === applicationId
  );

  if (applicationIndex === -1) {
    return Response.json(
      {
        success: false,
        message: "Application not found.",
      },
      { status: 404 }
    );
  }

  const deletedApplication = applications.splice(
    applicationIndex,
    1
  )[0];

  return Response.json({
    success: true,
    message: "Application deleted successfully.",
    data: deletedApplication,
  });
}