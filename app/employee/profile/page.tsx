"use client";
import { FormEvent, useEffect, useState } from "react";
export default function Page() {
  const [data, setData] = useState({
      fullName: "",
      companyName: "",
      companyWebsite: "",
      companyDescription: "",
      location: "",
    }),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(false);
  useEffect(() => {
    fetch("/api/auth/me")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.message);
        setData({
          fullName: j.user.fullName,
          companyName: j.user.companyName || "",
          companyWebsite: j.user.companyWebsite || "",
          companyDescription: j.user.companyDescription || "",
          location: j.user.location || "",
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      const r = await fetch("/api/employee/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message);
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save profile.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <p className="eyebrow">Your recruitment identity</p>
      <h1 className="page-title">Company Profile</h1>
      <p className="my-4 text-slate-600">
        Keep your contact name and organisation information up to date.
      </p>
      {loading ? (
        <p role="status">Loading profile…</p>
      ) : (
        <form className="panel max-w-3xl" onSubmit={save}>
          <fieldset disabled={busy} className="grid gap-5">
            {(
              [
                ["fullName", "Contact name", 120],
                ["companyName", "Company name", 160],
                ["companyWebsite", "Company website", 2000],
                ["location", "Location", 120],
              ] as const
            ).map(([key, label, max]) => (
              <label className="form-label" key={key}>
                {label}
                <input
                  className="field"
                  required={key === "fullName" || key === "companyName"}
                  maxLength={max}
                  type={key === "companyWebsite" ? "url" : "text"}
                  value={data[key]}
                  onChange={(e) => setData({ ...data, [key]: e.target.value })}
                />
              </label>
            ))}
            <label className="form-label">
              About your company
              <textarea
                className="field"
                rows={5}
                maxLength={4000}
                value={data.companyDescription}
                onChange={(e) =>
                  setData({ ...data, companyDescription: e.target.value })
                }
              />
            </label>
          </fieldset>
          {error && (
            <p role="alert" className="mt-4 text-rose-700">
              {error}
            </p>
          )}
          {success && (
            <p role="status" className="mt-4 text-teal-700">
              Company profile saved.
            </p>
          )}
          <button disabled={busy} className="btn mt-5">
            {busy ? "Saving…" : "Save Profile"}
          </button>
        </form>
      )}
    </>
  );
}
