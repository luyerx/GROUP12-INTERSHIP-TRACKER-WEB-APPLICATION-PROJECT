import {
  applications,
  type Application,
} from "@/lib/applicationsStore";


export async function GET() {
  return Response.json({
    success: true,
    data: applications,
  });
}


export async function POST(request: Request) {
  const body = await request.json();

  if (!body.organisation || !body.roleTitle) {
    return Response.json(
      {
        success: false,
        message: "Organisation and role title are required.",
      },
      { status: 400 }
    );
  }

  const newApplication: Application = {
    id: applications.length + 1,
    organisation: body.organisation,
    roleTitle: body.roleTitle,
    location: body.location || "",
    deadline: body.deadline || "",
    status: body.status || "Interested",
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
}