"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section role="alert" className="panel m-6">
      <h2 className="text-xl font-semibold">We could not load this page</h2>
      <p className="my-3 text-slate-600">
        Please check your connection and try again.
      </p>
      <button className="btn" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
