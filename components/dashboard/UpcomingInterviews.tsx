"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
type Event = {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  organisation: string;
  applicationId: string;
};
export default function UpcomingInterviews() {
  const [rows, setRows] = useState<Event[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  async function load() {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/events", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || "Unable to load interviews.");
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      setRows(
        j.data
          .filter(
            (e: Event) =>
              e.type === "interview" && new Date(e.date + "T00:00:00") >= now,
          )
          .sort(
            (a: Event, b: Event) =>
              a.date.localeCompare(b.date) || a.time.localeCompare(b.time),
          )
          .slice(0, 5),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load interviews.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, []);
  return (
    <section className="panel mt-6">
      <div className="flex flex-wrap justify-between gap-3">
        <h2 className="font-semibold">Upcoming interviews</h2>
        <Link className="text-sm text-teal-700" href="/calendar">
          Open calendar →
        </Link>
      </div>
      {loading ? (
        <p role="status" className="mt-4">
          Loading interviews…
        </p>
      ) : error ? (
        <p role="alert" className="mt-4">
          {error}{" "}
          <button className="btn-secondary" onClick={() => void load()}>
            Retry
          </button>
        </p>
      ) : rows.length ? (
        rows.map((e) => (
          <Link
            className="mt-4 flex flex-wrap justify-between gap-2 rounded-lg bg-slate-50 p-4"
            key={e.id}
            href={"/applications/" + e.applicationId}
          >
            <span>
              {e.title}
              <span className="block text-sm text-slate-500">
                {e.organisation}
              </span>
            </span>
            <span className="text-sm">
              {e.date} {e.time}
            </span>
          </Link>
        ))
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          No interviews scheduled. Add an interview from your application or
          calendar when a company invites you.
        </p>
      )}
    </section>
  );
}
