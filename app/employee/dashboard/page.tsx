import RecruitmentOverview from "@/components/opportunities/RecruitmentOverview";
import { getAuthenticatedUser } from "@/lib/auth";
import { listOpportunities } from "@/lib/opportunitiesRepository";
export default async function Page() {
  const user = await getAuthenticatedUser();
  if (!user) return null;
  const rows = await listOpportunities(user);
  return <RecruitmentOverview name={user.fullName} rows={rows} />;
}
