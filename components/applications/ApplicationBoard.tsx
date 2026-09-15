import Deadline from "@/components/ui/Deadline";
import StatusBadge from "@/components/ui/StatusBadge";
import Link from "next/link";
type BoardApplication = { id: string; organisation: string; roleTitle: string; deadline: string; status: string };
const stages = ["Interested", "Preparing", "Applied", "Interview", "Offer"];
function Card({ application }: { application: BoardApplication }) {
  return (
    <Link href={"/applications/" + application.id} className="board-card">
      <p className="text-xs font-medium text-slate-600">{application.organisation}</p>
      <h3 className="mt-1 text-sm font-semibold">{application.roleTitle}</h3>
      <div className="mt-3"><StatusBadge value={application.status} /></div>
      <div className="mt-3 text-xs"><span className="text-slate-500">Deadline · </span><Deadline value={application.deadline} /></div>
      <p className="mt-3 text-xs font-medium text-teal-800">View application →</p>
    </Link>
  );
}
export default function ApplicationBoard({ applications }: { applications: BoardApplication[] }) {
  const closed = applications.filter(a => a.status === "Rejected" || a.status === "Withdrawn");
  return <section aria-label="Application board" className="mt-4">
    <p className="mb-3 text-xs text-slate-500">Grouped by current status. Filters and deadline sorting apply to this view.</p>
    <div className="application-board">{stages.map(stage => {
      const rows = applications.filter(a => a.status === stage);
      return <section key={stage} className="board-column" aria-label={stage + " applications"}>
        <h2 className="mb-4 flex items-center justify-between text-sm font-semibold">{stage}<span className="text-slate-500">{rows.length}</span></h2>
        <div className="space-y-3">{rows.map(a => <Card key={a.id} application={a} />)}{!rows.length && <p className="py-4 text-xs text-slate-500">No matching applications</p>}</div>
      </section>;
    })}</div>
    {closed.length > 0 && <details className="support-section mt-5" open>
      <summary className="cursor-pointer text-sm font-semibold">Rejected / Withdrawn ({closed.length})</summary>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{closed.map(a => <Card key={a.id} application={a} />)}</div>
    </details>}
  </section>;
}
