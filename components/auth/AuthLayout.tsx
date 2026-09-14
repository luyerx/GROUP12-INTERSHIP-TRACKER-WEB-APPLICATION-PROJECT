import { BriefcaseBusiness, Search, CalendarClock, Route } from "lucide-react";
export default function AuthLayout({
  children,
  mode,
}: {
  children: React.ReactNode;
  mode: "login" | "register";
}) {
  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-2">
        <section className="relative flex flex-col justify-between overflow-hidden bg-slate-950 p-7 text-white sm:p-12">
          <div>
            <div className="flex items-center gap-3">
              <BriefcaseBusiness className="h-9 w-9 rounded-lg bg-teal-400 p-2 text-slate-950" />
              <span className="font-semibold">Internship Tracker</span>
            </div>
            <p className="mt-6 text-xs lg:mt-12 font-bold uppercase tracking-[.2em] text-teal-300">
              Discover · Apply · Progress
            </p>
            <h1 className="mt-5 max-w-lg text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Your internship journey,
              <br />
              <span className="text-teal-300">from discovery to offer.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
              A shared internship platform where companies publish opportunities
              and students organise applications, deadlines and interviews in
              one place.
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
          aria-label={mode === "login" ? "Sign in" : "Create account"}
          className="flex items-center justify-center p-6 sm:p-12"
        >
          <div className="w-full max-w-md">{children}</div>
        </section>
      </div>
    </main>
  );
}
