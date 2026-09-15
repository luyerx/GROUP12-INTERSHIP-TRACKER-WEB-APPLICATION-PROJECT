"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowLeft, LoaderCircle, Eye, EyeOff } from "lucide-react";

import AuthLayout from "@/components/auth/AuthLayout";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout mode="reset">
          <p className="text-sm text-slate-500">Loading...</p>
        </AuthLayout>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!token) return setError("This reset link is missing a token.");
    if (password.length < 8)
      return setError("Password must contain at least 8 characters.");
    if (password !== confirmPassword)
      return setError("Passwords do not match.");

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result: { success: boolean; message?: string } =
        await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.message || "Unable to reset password.");
      router.push("/login?reset=success");
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Unable to reset password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout mode="reset">
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
        <p className="mt-8 text-sm font-medium text-slate-500">
          Password recovery
        </p>
        <h1 className="mt-2 page-title">Create a new password</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Choose a new password for your Internship Tracker account.
        </p>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!isSubmitting) void handleSubmit();
          }}
          className="mt-8 space-y-5"
        >
          <label className="block text-sm font-medium text-slate-700">
            New password
            <input
              type={showPassword ? "text" : "password"}
              disabled={isSubmitting}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "reset-error" : "password-hint"}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:ring-4 focus:ring-teal-50"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Confirm password
            <input
              type={showPassword ? "text" : "password"}
              disabled={isSubmitting}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "reset-error" : "password-hint"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:ring-4 focus:ring-teal-50"
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p id="password-hint" className="text-xs text-slate-500">
              Use at least 8 characters.
            </p>
            <button
              className="btn-secondary"
              type="button"
              aria-pressed={showPassword}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}{" "}
              {showPassword ? "Hide passwords" : "Show passwords"}
            </button>
          </div>
          {!token && (
            <p role="alert" className="text-sm text-rose-700">
              This link is incomplete.{" "}
              <Link className="underline" href="/forgot-password">
                Request a new reset link
              </Link>
              .
            </p>
          )}
          {error && (
            <p
              id="reset-error"
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !token}
            className="btn w-full disabled:opacity-60"
          >
            {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Reset password
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
