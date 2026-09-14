"use client";
import { FormEvent, useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import CompanyMark from "@/components/ui/CompanyMark";
import {
  LoadingState,
  ErrorState,
  SuccessFeedback,
} from "@/components/ui/Feedback";
export default function Page() {
  const [loadFailed, setLoadFailed] = useState(false);
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
      .catch((e) => {
        setError(e.message);
        setLoadFailed(true);
      })
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
      <PageHeader
        eyebrow="Your recruitment identity"
        title="Company Profile"
        description="Introduce your organisation and keep your recruiter contact details current."
      />
      {loading ? (
        <LoadingState label="Loading company profile…" />
      ) : loadFailed ? (
        <ErrorState
          title="Unable to load company profile"
          message={error}
          retry={() => window.location.reload()}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <form
            className="panel"
            onSubmit={save}
            onChange={() => setSuccess(false)}
          >
            <div className="form-section-header">
              <h2>Organisation details</h2>
              <p>Fields marked * are required.</p>
            </div>
            <fieldset disabled={busy} className="grid gap-5 sm:grid-cols-2">
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
                  {key === "fullName" || key === "companyName" ? " *" : ""}
                  <input
                    className="field"
                    required={key === "fullName" || key === "companyName"}
                    maxLength={max}
                    type={key === "companyWebsite" ? "url" : "text"}
                    value={data[key]}
                    onChange={(e) =>
                      setData({ ...data, [key]: e.target.value })
                    }
                  />
                </label>
              ))}
              <label className="form-label sm:col-span-2">
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
              <div className="mt-4">
                <ErrorState message={error} />
              </div>
            )}
            {success && (
              <div className="mt-4">
                <SuccessFeedback>Company profile saved.</SuccessFeedback>
              </div>
            )}
            <button disabled={busy} className="btn mt-5">
              {busy ? "Saving…" : "Save Profile"}
            </button>
          </form>
          <aside className="panel h-fit">
            <p className="eyebrow mb-5">Profile preview</p>
            <CompanyMark name={data.companyName || "Company"} large />
            <h2 className="mt-4 text-xl font-semibold">
              {data.companyName || "Your company"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {data.location || "Add your location"}
            </p>
            <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {data.companyDescription ||
                "Tell students about the work your company does and the opportunities you offer."}
            </p>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="eyebrow">Recruiter contact</p>
              <p className="mt-2 text-sm">
                {data.fullName || "Add a contact name"}
              </p>
            </div>
            <p className="mt-5 text-xs text-slate-500">
              Preview reflects your current form. Save to update your profile.
            </p>
          </aside>
        </div>
      )}
    </>
  );
}
