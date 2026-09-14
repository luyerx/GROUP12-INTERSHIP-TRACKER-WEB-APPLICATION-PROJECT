import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/auth";
import { listOpportunities } from "@/lib/opportunitiesRepository";
import { todayDate } from "@/lib/opportunity";
export default async function Page() {
  const user = await getAuthenticatedUser();
  if (!user) return null;
  const rows = await listOpportunities(user);
  return (
    <>
      <header className="hero">
        <p className="eyebrow">Recruitment overview</p>
        <h1 className="page-title">Welcome, {user.fullName.split(" ")[0]}</h1>
        <p className="mt-4 max-w-2xl">
          Help students find their next step. Build a useful listing, publish it
          to discovery, and keep closing dates current.
        </p>
        <div className="mt-5 flex gap-3">
          <Link className="btn" href="/employee/opportunities/new">
            Create Opportunity
          </Link>
          <Link className="btn-secondary" href="/employee/profile">
            Company Profile
          </Link>
        </div>
      </header>
      <section className="my-6 grid gap-4 sm:grid-cols-3">
        {[
          ["All listings", rows.length],
          [
            "Open published roles",
            rows.filter(
              (r) => r.status === "Published" && r.closingDate >= todayDate(),
            ).length,
          ],
          ["Drafts to finish", rows.filter((r) => r.status === "Draft").length],
        ].map(([label, value]) => (
          <div className="panel" key={label}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </section>
      <section className="panel">
        <h2 className="text-xl font-semibold">Your publishing checklist</h2>
        <ol className="my-4 list-inside list-decimal space-y-3 text-slate-600">
          <li>Complete your company profile.</li>
          <li>Describe the role, eligibility and how students should apply.</li>
          <li>Publish with a current closing date.</li>
          <li>Close the role when recruitment finishes.</li>
        </ol>
        <Link className="btn-secondary" href="/employee/opportunities">
          Manage My Opportunities →
        </Link>
      </section>
    </>
  );
}
