import {
  applications,
  isApplicationStatus,
} from "@/lib/applicationsStore";

import { authorizeRole } from "@/lib/authorization";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authorization =
      await authorizeRole("student");

    if (!authorization.authorized) {
      return authorization.response;
    }

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

    if (!isApplicationStatus(body.status)) {
      return Response.json(
        {
          success: false,
          message: "Invalid application status.",
        },
        { status: 400 }
      );
    }

    application.status = body.status;
    application.updatedAt =
      new Date().toISOString();

    return Response.json({
      success: true,
      message:
        "Application status updated successfully.",
      data: application,
    });
  } catch (error) {
    console.error(
      "Failed to update application status:",
      error
    );

    return Response.json(
      {
        success: false,
        message:
          "Failed to update application status.",
      },
      { status: 500 }
    );
  }
}