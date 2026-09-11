"use client";

import Link from "next/link";
import { useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  Mail,
} from "lucide-react";

import AuthLayout from "@/components/auth/AuthLayout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] =
    useState("");
  const [requestError, setRequestError] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isSent, setIsSent] =
    useState(false);

  const [resetUrl, setResetUrl] =
    useState("");

  const validateEmail = () => {
    setEmailError("");
    setRequestError("");

    if (!email.trim()) {
      setEmailError(
        "Email is required."
      );
      return false;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      setEmailError(
        "Please enter a valid email address."
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateEmail()) {
      return;
    }

    setIsSubmitting(true);
    setRequestError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result: { success: boolean; message?: string; resetUrl?: string } = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to create reset instructions.");
      setResetUrl(result.resetUrl || "");
      setIsSent(true);
    } catch (error) {
      console.error(
        "Password reset error:",
        error
      );

      setRequestError(
        "Unable to send the reset instructions. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout mode="login">
      {!isSent ? (
        <>
          {/* Back */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>

          {/* Header */}
          <div className="mt-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Mail className="h-5 w-5" />
            </div>

            <p className="mt-6 text-sm font-medium text-slate-500">
              Password recovery
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Forgot your password?
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Enter the email address linked
              to your Internship Tracker
              account and we&apos;ll send you
              instructions to reset your
              password.
            </p>
          </div>

          {/* Form */}
          <div className="mt-8">
            <label
              htmlFor="email"
              className="text-sm font-medium text-slate-700"
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              disabled={isSubmitting}
              onChange={(event) => {
                setEmail(
                  event.target.value
                );

                if (emailError) {
                  setEmailError("");
                }
              }}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter"
                ) {
                  void handleSubmit();
                }
              }}
              placeholder="you@example.com"
              className={`mt-2 w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                emailError
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
              }`}
            />

            {emailError && (
              <p className="mt-2 text-xs font-medium text-rose-600">
                {emailError}
              </p>
            )}

            {requestError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                <p className="text-sm leading-6 text-rose-700">
                  {requestError}
                </p>
              </div>
            )}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() =>
                void handleSubmit()
              }
              className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Sending instructions...
                </>
              ) : (
                <>
                  Send reset instructions

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </div>

          {/* Bottom */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-500">
              Remember your password?
            </p>

            <Link
              href="/login"
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-950 transition hover:text-slate-600"
            >
              Return to sign in

              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </>
      ) : (
        <SuccessState
          email={email}
          resetUrl={resetUrl}
          onTryAgain={() => {
            setIsSent(false);
            setResetUrl("");
            setEmailError("");
            setRequestError("");
          }}
        />
      )}
    </AuthLayout>
  );
}

function SuccessState({
  email,
  resetUrl,
  onTryAgain,
}: {
  email: string;
  resetUrl: string;
  onTryAgain: () => void;
}) {
  return (
    <div className="py-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="h-6 w-6" />
      </div>

      <p className="mt-7 text-sm font-medium text-slate-500">
        Check your inbox
      </p>

      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
        Reset instructions sent
      </h1>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        If an Internship Tracker account
        exists for{" "}
        <span className="font-medium text-slate-700">
          {email}
        </span>
        , password reset instructions have
        been sent to that address.
      </p>

      {resetUrl && (
        <Link
          href={resetUrl}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Continue to reset password
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}

      <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-800">
          Didn&apos;t receive the email?
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Check your spam folder or make
          sure the email address you entered
          is correct.
        </p>

        <button
          type="button"
          onClick={onTryAgain}
          className="mt-3 text-sm font-semibold text-slate-950 transition hover:text-slate-600"
        >
          Try another email
        </button>
      </div>

      <Link
        href="/login"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </div>
  );
}