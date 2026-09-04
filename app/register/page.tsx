"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";

import AuthLayout from "@/components/auth/AuthLayout";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [acceptTerms, setAcceptTerms] =
    useState(false);

  const [
    fullNameError,
    setFullNameError,
  ] = useState("");

  const [
    emailError,
    setEmailError,
  ] = useState("");

  const [
    passwordError,
    setPasswordError,
  ] = useState("");

  const [
    confirmPasswordError,
    setConfirmPasswordError,
  ] = useState("");

  const [termsError, setTermsError] =
    useState("");

  const [
    registerError,
    setRegisterError,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const validateForm = () => {
    let isValid = true;

    setFullNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setTermsError("");
    setRegisterError("");

    if (!fullName.trim()) {
      setFullNameError(
        "Full name is required."
      );

      isValid = false;
    } else if (
      fullName.trim().length < 2
    ) {
      setFullNameError(
        "Please enter your full name."
      );

      isValid = false;
    }

    if (!email.trim()) {
      setEmailError(
        "Email is required."
      );

      isValid = false;
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      setEmailError(
        "Please enter a valid email address."
      );

      isValid = false;
    }

    if (!password) {
      setPasswordError(
        "Password is required."
      );

      isValid = false;
    } else if (
      password.length < 8
    ) {
      setPasswordError(
        "Password must contain at least 8 characters."
      );

      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError(
        "Please confirm your password."
      );

      isValid = false;
    } else if (
      password !== confirmPassword
    ) {
      setConfirmPasswordError(
        "Passwords do not match."
      );

      isValid = false;
    }

    if (!acceptTerms) {
      setTermsError(
        "You must agree before creating an account."
      );

      isValid = false;
    }

    return isValid;
  };

  const handleRegister =
    async () => {
      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);
      setRegisterError("");

      try {
        /*
         * Temporary registration simulation.
         * Later this will be replaced
         * with the real authentication API.
         */
        await new Promise(
          (resolve) =>
            setTimeout(resolve, 1000)
        );

        router.push("/dashboard");
        router.refresh();
      } catch (error) {
        console.error(
          "Registration error:",
          error
        );

        setRegisterError(
          "Unable to create your account. Please try again."
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  return (
    <AuthLayout mode="register">
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>

      <div className="mt-7">
        <p className="text-sm font-medium text-slate-500">
          Create account
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Create your student workspace
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Set up your account to start
          tracking internship applications
          and important career dates.
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {/* Full name */}
        <div>
          <label
            htmlFor="fullName"
            className="text-sm font-medium text-slate-700"
          >
            Full name
          </label>

          <input
            id="fullName"
            type="text"
            autoComplete="name"
            value={fullName}
            disabled={isSubmitting}
            onChange={(event) => {
              setFullName(
                event.target.value
              );

              if (
                fullNameError
              ) {
                setFullNameError("");
              }
            }}
            placeholder="Enter your full name"
            className={`mt-2 w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
              fullNameError
                ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
            }`}
          />

          {fullNameError && (
            <p className="mt-2 text-xs font-medium text-rose-600">
              {fullNameError}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
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
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="text-sm font-medium text-slate-700"
          >
            Password
          </label>

          <div className="relative mt-2">
            <input
              id="password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              autoComplete="new-password"
              value={password}
              disabled={isSubmitting}
              onChange={(event) => {
                setPassword(
                  event.target.value
                );

                if (
                  passwordError
                ) {
                  setPasswordError("");
                }

                if (
                  confirmPasswordError
                ) {
                  setConfirmPasswordError("");
                }
              }}
              placeholder="At least 8 characters"
              className={`w-full rounded-xl border bg-white px-3.5 py-3 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                passwordError
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
              }`}
            />

            <button
              type="button"
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              disabled={isSubmitting}
              onClick={() =>
                setShowPassword(
                  (current) =>
                    !current
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {passwordError && (
            <p className="mt-2 text-xs font-medium text-rose-600">
              {passwordError}
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-slate-700"
          >
            Confirm password
          </label>

          <div className="relative mt-2">
            <input
              id="confirmPassword"
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              autoComplete="new-password"
              value={confirmPassword}
              disabled={isSubmitting}
              onChange={(event) => {
                setConfirmPassword(
                  event.target.value
                );

                if (
                  confirmPasswordError
                ) {
                  setConfirmPasswordError("");
                }
              }}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter"
                ) {
                  void handleRegister();
                }
              }}
              placeholder="Enter your password again"
              className={`w-full rounded-xl border bg-white px-3.5 py-3 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                confirmPasswordError
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
              }`}
            />

            <button
              type="button"
              aria-label={
                showConfirmPassword
                  ? "Hide password"
                  : "Show password"
              }
              disabled={isSubmitting}
              onClick={() =>
                setShowConfirmPassword(
                  (current) =>
                    !current
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          {confirmPasswordError && (
            <p className="mt-2 text-xs font-medium text-rose-600">
              {confirmPasswordError}
            </p>
          )}
        </div>

        {/* Terms */}
        <div>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={acceptTerms}
              disabled={isSubmitting}
              onChange={(event) => {
                setAcceptTerms(
                  event.target.checked
                );

                if (termsError) {
                  setTermsError("");
                }
              }}
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
            />

            <span className="text-xs leading-5 text-slate-500">
              I agree to use Internship
              Tracker responsibly and
              understand that my account
              information will be used to
              provide access to my
              workspace.
            </span>
          </label>

          {termsError && (
            <p className="mt-2 text-xs font-medium text-rose-600">
              {termsError}
            </p>
          )}
        </div>

        {/* Registration error */}
        {registerError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-sm leading-6 text-rose-700">
              {registerError}
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() =>
            void handleRegister()
          }
          className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create account

              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>

      <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
        <p className="text-sm text-slate-500">
          Already have an account?
        </p>

        <Link
          href="/login"
          className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-950 transition hover:text-slate-600"
        >
          Sign in to your workspace

          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </AuthLayout>
  );
}