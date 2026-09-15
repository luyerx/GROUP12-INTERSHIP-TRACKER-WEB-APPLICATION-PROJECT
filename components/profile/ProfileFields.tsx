"use client";
import { useId } from "react";

type ProfileSectionProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function ProfileSection({
  icon,
  title,
  description,
  children,
}: ProfileSectionProps) {
  return (
    <section className="card p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icon}
        </div>

        <div>
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>

          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

type ProfileBadgeProps = {
  children: React.ReactNode;
  icon?: React.ReactNode;
};

export function ProfileBadge({ children, icon }: ProfileBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
      {icon}
      {children}
    </span>
  );
}

type ProfileFieldProps = {
  label: string;
  value: string;
  displayValue: string;
  editing: boolean;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
};

export function ProfileField({
  label,
  value,
  displayValue,
  editing,
  onChange,
  error,
  type = "text",
  placeholder,
}: ProfileFieldProps) {
  const fieldId = useId();
  return (
    <div>
      <label
        htmlFor={editing ? fieldId : undefined}
        className="text-xs font-medium uppercase tracking-wide text-slate-500"
      >
        {label}
      </label>

      {editing ? (
        <>
          <input
            id={fieldId}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? fieldId + "-error" : undefined}
            type={type}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className={`mt-2 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
              error
                ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
            }`}
          />

          {error && (
            <p
              id={fieldId + "-error"}
              role="alert"
              className="mt-2 text-xs font-medium text-rose-600"
            >
              {error}
            </p>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm font-medium leading-6 text-slate-800">
          {displayValue || "Not provided"}
        </p>
      )}
    </div>
  );
}

type NotificationSettingProps = {
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
};

export function NotificationSetting({
  title,
  description,
  checked,
  disabled,
  onChange,
}: NotificationSettingProps) {
  return (
    <div
      className={`flex items-start justify-between gap-5 py-5 first:pt-0 last:pb-0 ${
        disabled ? "opacity-70" : ""
      }`}
    >
      <div>
        <p className="text-sm font-medium text-slate-800">{title}</p>

        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-slate-950" : "bg-slate-200"
        } ${
          disabled ? "cursor-not-allowed" : "cursor-pointer hover:opacity-90"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}
