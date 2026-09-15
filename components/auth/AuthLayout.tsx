import { BriefcaseBusiness, Search, CalendarClock, Route } from "lucide-react";
export default function AuthLayout({
  children,
  mode,
}: {
  children: React.ReactNode;
  mode: "login" | "register" | "recovery" | "reset";
}) {
  const copy = {
    login: ["Welcome back", "Your next career step", "starts here.", "Return to your opportunities, application progress and important dates."],
    register: ["Discover · Apply · Progress", "Your internship journey,", "from discovery to offer.", "Join a shared platform for students discovering opportunities and employers opening doors."],
    recovery: ["Account recovery", "Let’s get you", "back on track.", "Request a password reset link to regain access to your workspace."],
    reset: ["A fresh start", "Secure your account,", "continue your journey.", "Choose a new password, then sign in to return to your workspace."],
  }[mode];
  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-2">
        <section className="relative flex flex-col justify-between overflow-hidden bg-slate-950 p-7 text-white sm:p-12">
          <div>
            <div className="flex items-center gap-3">
              <BriefcaseBusiness className="h-9 w-9 rounded-lg bg-teal-800 p-2 text-white" />
              <span className="font-semibold">Internship Tracker</span>
            </div>
            <p className="mt-6 text-xs lg:mt-12 font-bold uppercase tracking-[.2em] text-teal-300">
              {copy[0]}
            </p>
            <h2 className="mt-5 max-w-lg text-2xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {copy[1]}
              <br />
              <span className="text-teal-300">{copy[2]}</span>
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300 lg:text-base">
              {copy[3]}
            </p>
            <div className="my-9 hidden gap-5 lg:grid">
              {[
                [
                  Search,
                  "Find your next opportunity",
                  "Explore published internships and graduate roles.",
                ],
                [
                  Route,
                  "See every application move forward",
                  "Track interest, preparation, interviews and outcomes.",
                ],
                [
                  CalendarClock,
                  "Stay ahead of important dates",
                  "Keep application deadlines and interview plans together.",
                ],
              ].map(([Icon, title, copy]) => {
                const I = Icon as typeof Search;
                return (
                  <div className="flex gap-4" key={String(title)}>
                    <I
                      aria-hidden="true"
                      className="mt-1 h-5 w-5 shrink-0 text-teal-300"
                    />
                    <div>
                      <h2 className="font-medium">{String(title)}</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        {String(copy)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="hidden border-t border-white/15 pt-6 lg:block">
            <p className="text-sm text-slate-300">
              For students building their future. For employers opening doors.
            </p>
            <p className="mt-3 text-xs text-teal-300">
              01 Discover → 02 Track → 03 Prepare → 04 Progress
            </p>
          </div>
        </section>
        <section
          aria-label={
            mode === "login"
              ? "Sign in"
              : (mode === "recovery" || mode === "reset")
                ? "Password recovery"
                : "Create account"
          }
          className="flex items-center justify-center p-6 sm:p-12"
        >
          <div className="w-full max-w-md">{children}</div>
        </section>
      </div>
    </main>
  );
}
