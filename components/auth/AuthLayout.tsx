import {
  BriefcaseBusiness,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type AuthLayoutProps = {
  children: React.ReactNode;
  mode: "login" | "register";
};

export default function AuthLayout({
  children,
  mode,
}: AuthLayoutProps) {
  const isLogin = mode === "login";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl items-center justify-center sm:min-h-[calc(100vh-3rem)] lg:min-h-[calc(100vh-4rem)]">
        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Brand panel */}
          <section className="relative overflow-hidden bg-slate-950 px-8 py-10 text-white sm:px-10 lg:min-h-190 lg:px-14 lg:py-14">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/5" />
            <div className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full border border-white/5" />
            <div className="pointer-events-none absolute bottom-24 left-10 h-40 w-40 rounded-full bg-white/[0.025] blur-3xl" />

            <div className="relative flex h-full flex-col">
              {/* Branding */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-lg shadow-black/20">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Career Workspace
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white">
                    Internship Tracker
                  </p>
                </div>
              </div>

              {/* Main copy */}
              <div className="mt-16 max-w-xl lg:mt-24">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
                  <Sparkles className="h-3.5 w-3.5" />

                  {isLogin
                    ? "Student career management"
                    : "Build your career workspace"}
                </div>

                <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                  {isLogin
                    ? "Keep every opportunity under control."
                    : "Start organising your internship journey."}
                </h1>

                <p className="mt-5 max-w-lg text-sm leading-7 text-slate-400 sm:text-base">
                  {isLogin
                    ? "Organise internship applications, deadlines, interviews, notes, and preparation in one focused workspace."
                    : "Create your student workspace and keep every application, deadline, interview, and preparation task organised from the beginning."}
                </p>

                {/* Feature list */}
                <div className="mt-10 space-y-4">
                  <FeatureItem
                    icon={<CheckCircle2 className="h-4 w-4" />}
                    title={
                      isLogin
                        ? "Track every application"
                        : "One workspace for every application"
                    }
                    description={
                      isLogin
                        ? "Keep roles, statuses, notes, and outcomes together."
                        : "Track progress from interest to final outcome."
                    }
                  />

                  <FeatureItem
                    icon={<ShieldCheck className="h-4 w-4" />}
                    title={
                      isLogin
                        ? "Stay organised throughout your search"
                        : "Your own student workspace"
                    }
                    description={
                      isLogin
                        ? "Manage deadlines, interviews, and reminders."
                        : "Keep your career planning information together."
                    }
                  />

                  <FeatureItem
                    icon={<Sparkles className="h-4 w-4" />}
                    title={
                      isLogin
                        ? "Prepare smarter with AI"
                        : "Prepare with smarter tools"
                    }
                    description={
                      isLogin
                        ? "Summarise roles and prepare for interviews."
                        : "Use AI-assisted summaries and interview preparation."
                    }
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-16 border-t border-white/10 pt-6 lg:mt-auto">
                <p className="text-xs leading-5 text-slate-500">
                  {isLogin
                    ? "Designed for students managing internship and graduate opportunities."
                    : "Create an account to access the student Internship Tracker workspace."}
                </p>
              </div>
            </div>
          </section>

          {/* Form panel */}
          <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-16">
            <div className="w-full max-w-md">{children}</div>
          </section>
        </div>
      </div>
    </main>
  );
}

type FeatureItemProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

function FeatureItem({
  icon,
  title,
  description,
}: FeatureItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300">
        {icon}
      </div>

      <div>
        <p className="text-sm font-medium text-white">
          {title}
        </p>

        <p className="mt-0.5 text-xs text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}