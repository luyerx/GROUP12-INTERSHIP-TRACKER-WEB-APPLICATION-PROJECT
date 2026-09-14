import Link from "next/link";
import {
  FileSearch,
  MessageSquareText,
  Target,
  ArrowUpRight,
  Sparkles,
  BookOpen,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PageHeader from "@/components/ui/PageHeader";
const tools = [
  {
    title: "Understand a role",
    icon: FileSearch,
    copy: "Read the original description and separate responsibilities, eligibility and application instructions.",
  },
  {
    title: "Prepare for an interview",
    icon: MessageSquareText,
    copy: "Prepare examples of your work, practise explaining your contribution, and write questions for the employer.",
  },
  {
    title: "Review required skills",
    icon: Target,
    copy: "Compare the skills listed by the employer with your own projects and coursework.",
  },
];
export default function AIAssistantPage() {
  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Career preparation"
        title="AI Assistant"
        description="A place to turn opportunity details into a clear preparation plan."
      />
      <section className="hero">
        <div className="flex items-start gap-4">
          <span className="state-icon">
            <Sparkles aria-hidden="true" size={22} />
          </span>
          <div>
            <span className="badge">Not yet available</span>
            <h2 className="mt-3 text-xl font-semibold text-slate-900">
              Personalised AI support is coming later.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7">
              AI analysis is not connected in this version. Use the preparation
              steps below and your saved role descriptions to plan your next
              move.
            </p>
          </div>
        </div>
      </section>
      <section
        aria-label="Preparation tools"
        className="mt-6 grid gap-4 md:grid-cols-3"
      >
        {tools.map(({ title, icon: Icon, copy }, i) => (
          <article className="panel" key={title}>
            <div className="flex items-center justify-between">
              <span className="state-icon">
                <Icon aria-hidden="true" size={21} />
              </span>
              <span className="eyebrow">0{i + 1}</span>
            </div>
            <h2 className="mt-5 text-lg font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{copy}</p>
          </article>
        ))}
      </section>
      <section className="panel mt-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="eyebrow">Start with what you have</p>
            <h2 className="mt-2 text-lg font-semibold">
              Bring your next application into focus.
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Open a saved role or explore the platform’s career guides.
            </p>
          </div>
          <div className="page-actions">
            <Link className="btn" href="/applications">
              Open My Applications
              <ArrowUpRight size={16} />
            </Link>
            <Link className="btn-secondary" href="/resources">
              <BookOpen size={16} />
              Career Resources
            </Link>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
