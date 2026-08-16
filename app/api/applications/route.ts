<<<<<<< HEAD
import {
  applications,
  getNextApplicationId,
  isApplicationStatus,
  type Application,
} from "@/lib/applicationsStore";
=======
import { applicationInputSchema } from "@/lib/application";
import { createApplication, listApplications } from "@/lib/applicationsRepository";
>>>>>>> c32dc60 (Complete database setup and improve frontend)

export async function GET() {
  try {
    return Response.json({ success: true, data: await listApplications() });
  } catch (error) {
    console.error("List applications error:", error);
    return Response.json({ success: false, message: "Unable to load applications." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
<<<<<<< HEAD
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
=======
    const parsed = applicationInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ success: false, message: parsed.error.issues[0]?.message || "Invalid application data." }, { status: 400 });
    }
    const application = await createApplication(parsed.data);
    return Response.json({ success: true, message: "Application created successfully.", data: application }, { status: 201 });
  } catch (error) {
    console.error("Create application error:", error);
    return Response.json({ success: false, message: "Unable to create application." }, { status: 500 });
  }
}
>>>>>>> c32dc60 (Complete database setup and improve frontend)
