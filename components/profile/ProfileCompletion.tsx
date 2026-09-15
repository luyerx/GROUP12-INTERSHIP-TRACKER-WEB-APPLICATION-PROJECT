"use client";
import {
  Sparkles
} from "lucide-react";

export default function ProfileCompletion({ profileCompletion }: { profileCompletion: number }) {
  return (<div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 xl:w-72">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Profile completion
        </p>

        <p className="mt-1 text-lg font-semibold text-slate-950">
          {profileCompletion}%
        </p>
      </div>

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
        <Sparkles className="h-4 w-4" />
      </div>
    </div>

    <div
      role="progressbar"
      aria-label="Profile completion"
      aria-valuenow={profileCompletion}
      aria-valuemin={0}
      aria-valuemax={100}
      className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"
    >
      <div
        className="h-full rounded-full bg-slate-950 transition-all duration-300"
        style={{
          width: `${profileCompletion}%`,
        }}
      />
    </div>

    <p className="mt-3 text-xs leading-5 text-slate-500">
      Keep your profile complete to maintain an organised career
      workspace.
    </p>
  </div>);
}
