import {
  applications,
  getNextApplicationId,
  isApplicationStatus,
  type Application,
} from "@/lib/applicationsStore";

import { authorizeRole } from "@/lib/authorization";

export async function GET() {
  const authorization =
    await authorizeRole("student");

  if (!authorization.authorized) {
    return authorization.response;
  }

  return Response.json({
    success: true,
    data: applications,
  });
}

export async function POST(request: Request) {
  const authorization =
    await authorizeRole("student");

  if (!authorization.authorized) {
    return authorization.response;
  }

  const body = await request.json();

  if (!body.organisation || !body.roleTitle) {
    return Response.json(
      {
        success: false,
        message:
          "Organisation and role title are required.",
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
    status: isApplicationStatus(body.status)
      ? body.status
      : "Interested",
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
      message:
        "Application created successfully.",
      data: newApplication,
    },
    { status: 201 }
  );
}