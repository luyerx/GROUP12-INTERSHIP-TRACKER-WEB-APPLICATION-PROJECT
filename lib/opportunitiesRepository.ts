import "server-only";
import { OpportunityModel } from "@/lib/models/Opportunity";
import { ApplicationModel } from "@/lib/models/Application";
import { UserModel } from "@/lib/models/User";
import { connectToDatabase } from "@/lib/mongodb";
import type { AuthenticatedUser } from "@/lib/auth";
import { todayDate } from "@/lib/opportunity";
export async function listOpportunities(user: AuthenticatedUser) {
  await connectToDatabase();
  const filter =
    user.role === "student"
      ? { status: "Published", closingDate: { $gte: todayDate() } }
      : user.role === "employee"
        ? { createdBy: user.id }
        : {};
  const rows = await OpportunityModel.find(filter)
    .sort({ updatedAt: -1 })
    .lean();
  const applications =
    user.role === "student"
      ? await ApplicationModel.find({
          userId: user.id,
          opportunityId: { $in: rows.map((r) => r._id) },
        })
          .select("opportunityId")
          .lean()
      : [];
  const publishers = await UserModel.find({
    _id: { $in: rows.flatMap((r) => (r.createdBy ? [r.createdBy] : [])) },
  })
    .select("fullName companyName")
    .lean();
  return rows.map((row) => ({
    ...row,
    id: String(row._id),
    createdBy: row.createdBy ? String(row.createdBy) : undefined,
    publisher:
      publishers.find((p) => String(p._id) === String(row.createdBy))
        ?.companyName ||
      publishers.find((p) => String(p._id) === String(row.createdBy))
        ?.fullName ||
      "Admin / legacy listing",
    applicationId: applications
      .find((a) => String(a.opportunityId) === String(row._id))
      ?._id.toString(),
  }));
}
