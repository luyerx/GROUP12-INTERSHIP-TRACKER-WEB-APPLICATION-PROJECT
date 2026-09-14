import { authorizeRole } from "@/lib/authorization";
import { UserModel } from "@/lib/models/User";
import { ApplicationModel } from "@/lib/models/Application";
import { OpportunityModel } from "@/lib/models/Opportunity";
import { ResourceModel } from "@/lib/models/Resource";
import { todayDate } from "@/lib/opportunity";
export async function GET() {
  try {
    const auth = await authorizeRole("admin");
    if (!auth.authorized) return auth.response;
    const [
      students,
      employees,
      admins,
      applications,
      published,
      drafts,
      resources,
    ] = await Promise.all([
      UserModel.countDocuments({ role: "student" }),
      UserModel.countDocuments({ role: "employee" }),
      UserModel.countDocuments({ role: "admin" }),
      ApplicationModel.countDocuments(),
      OpportunityModel.countDocuments({
        status: "Published",
        closingDate: { $gte: todayDate() },
      }),
      OpportunityModel.countDocuments({ status: "Draft" }),
      ResourceModel.countDocuments({ status: "Published" }),
    ]);
    return Response.json({
      success: true,
      data: {
        students,
        employees,
        admins,
        applications,
        published,
        drafts,
        resources,
      },
    });
  } catch {
    return Response.json(
      { message: "Unable to load platform statistics." },
      { status: 500 },
    );
  }
}
