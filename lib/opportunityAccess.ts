import "server-only";
import { UserModel } from "@/lib/models/User";
import { todayDate } from "@/lib/opportunity";

// Shared by discovery, direct access, tracking and the snapshot's latest link.
export async function studentOpportunityFilter() {
  const owners = await UserModel.find({ role: "employee", status: "Active" }).select("_id").lean();
  return { status: "Published", closingDate: { $gte: todayDate() }, createdBy: { $in: owners.map(owner => owner._id) } };
}
