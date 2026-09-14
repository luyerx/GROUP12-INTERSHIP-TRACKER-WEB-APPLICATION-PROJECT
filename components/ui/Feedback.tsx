import { AlertCircle, CheckCircle2, Search, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="empty-state">
      <span className="state-icon">
        <Search aria-hidden="true" size={22} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action && <div className="page-actions justify-center">{action}</div>}
    </section>
  );
}
export function ErrorState({
  title = "Something went wrong",
  message,
  retry,
}: {
  title?: string;
  message: string;
  retry?: () => void;
}) {
  return (
    <section className="feedback feedback-error" role="alert">
      <AlertCircle aria-hidden="true" size={20} />
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6">{message}</p>
        {retry && (
          <button type="button" className="btn-secondary mt-4" onClick={retry}>
            Try again
          </button>
        )}
      </div>
    </section>
  );
}
export function SuccessFeedback({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="feedback feedback-success">
      <CheckCircle2 aria-hidden="true" size={20} />
      <p>{children}</p>
    </div>
  );
}
export function LoadingState({
  label = "Loading your workspace…",
}: {
  label?: string;
}) {
  return (
    <section
      className="card p-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
        <LoaderCircle aria-hidden="true" size={18} className="animate-spin" />
        {label}
      </div>
      <div aria-hidden="true" className="mt-6 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
    </section>
  );
}
