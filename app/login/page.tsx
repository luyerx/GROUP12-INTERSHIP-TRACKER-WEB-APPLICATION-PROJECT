"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";

import AuthLayout from "@/components/auth/AuthLayout";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);

  const [emailError, setEmailError] = useState("");

  const [passwordError, setPasswordError] = useState("");

  const [loginError, setLoginError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    let isValid = true;

    setEmailError("");
    setPasswordError("");
    setLoginError("");

    if (!email.trim()) {
      setEmailError("Email is required.");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required.");
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must contain at least 8 characters.");
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setLoginError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          rememberMe,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setLoginError(
          result.message ||
            "Unable to sign in. Please check your details and try again.",
        );
        return;
      }

      // Redirect users to the correct workspace based on their role.
      if (result.user?.role === "admin") {
        router.push("/admin/dashboard");
      } else if (result.user?.role === "employee") {
        router.push("/employee/dashboard");
      } else {
        router.push("/dashboard");
      }

      router.refresh();
    } catch (error) {
      console.error("Login error:", error);

      setLoginError(
        "Unable to sign in. Please check your details and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout mode="login">
      <div>
        <p className="text-sm font-medium text-slate-500">Welcome back</p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          Sign in to your workspace
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Continue managing your applications, deadlines, interviews, and
          preparation.
        </p>
      </div>

      <div className="mt-9 space-y-5">
        {/* Email */}
        <div>
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email address
          </label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            disabled={isSubmitting}
            onChange={(event) => {
              setEmail(event.target.value);

              if (emailError) {
                setEmailError("");
              }

              if (loginError) {
                setLoginError("");
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleLogin();
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
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <Link
              href="/forgot-password"
              className="text-xs font-medium text-slate-500 transition hover:text-slate-950"
            >
              Forgot password?
            </Link>
          </div>

          <div className="relative mt-2">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              disabled={isSubmitting}
              onChange={(event) => {
                setPassword(event.target.value);

                if (passwordError) {
                  setPasswordError("");
                }

                if (loginError) {
                  setLoginError("");
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleLogin();
                }
              }}
              placeholder="Enter your password"
              className={`w-full rounded-xl border bg-white px-3.5 py-3 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 ${
                passwordError
                  ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                  : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
              }`}
            />

            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              disabled={isSubmitting}
              onClick={() => setShowPassword((current) => !current)}
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

        {/* Remember me */}
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={rememberMe}
            disabled={isSubmitting}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />

          <span className="text-sm text-slate-600">Remember me</span>
        </label>

        {/* Login error */}
        {loginError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-sm leading-6 text-rose-700">{loginError}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => void handleLogin()}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>

      {/* Register */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
        <p className="text-sm text-slate-500">New to Internship Tracker?</p>

        <Link
          href="/register"
          className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-950 transition hover:text-slate-600"
        >
          Create an account
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <p className="mt-7 text-center text-xs leading-5 text-slate-400">
        Your account information is used only to provide access to your
        Internship Tracker workspace.
      </p>
    </AuthLayout>
  );
}
