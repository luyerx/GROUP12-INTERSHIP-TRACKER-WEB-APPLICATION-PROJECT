"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowLeft, LoaderCircle } from "lucide-react";

import AuthLayout from "@/components/auth/AuthLayout";

export default function ResetPasswordPage() {
  return <Suspense fallback={<AuthLayout mode="login"><p className="text-sm text-slate-500">Loading...</p></AuthLayout>}><ResetPasswordForm /></Suspense>;
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!token) return setError("This reset link is missing a token.");
    if (password.length < 8) return setError("Password must contain at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result: { success: boolean; message?: string } = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to reset password.");
      router.push("/login?reset=success");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Unable to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return <AuthLayout mode="login"><div className="mx-auto w-full max-w-md">
    <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-950"><ArrowLeft className="h-4 w-4" />Back to sign in</Link>
    <p className="mt-8 text-sm font-medium text-slate-500">Password recovery</p>
    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Create a new password</h1>
    <p className="mt-3 text-sm leading-6 text-slate-500">Choose a new password for your Internship Tracker account.</p>
    <div className="mt-8 space-y-5">
      <label className="block text-sm font-medium text-slate-700">New password<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:ring-4 focus:ring-slate-100" /></label>
      <label className="block text-sm font-medium text-slate-700">Confirm password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:ring-4 focus:ring-slate-100" /></label>
      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      <button type="button" disabled={isSubmitting} onClick={() => void handleSubmit()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white disabled:opacity-60">{isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}Reset password</button>
    </div>
  </div></AuthLayout>;
}
