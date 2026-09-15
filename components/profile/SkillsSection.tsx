"use client";
import { ProfileData } from "@/components/profile/profileTypes";
import {
  Plus,
  X
} from "lucide-react";

export default function SkillsSection({ profile, draft, isEditing, newSkill, setNewSkill, addSkill, removeSkill }: { profile: ProfileData; draft: ProfileData; isEditing: boolean; newSkill: string; setNewSkill: (value: string) => void; addSkill: () => void; removeSkill: (skill: string) => void }) {
  return (<section className="card p-6">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold text-slate-950">
          Skills
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Technical and professional strengths relevant to your
          career.
        </p>
      </div>

      <div className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
        {(isEditing ? draft.skills : profile.skills).length} skills
      </div>
    </div>

    <div className="mt-5 flex min-h-20 flex-wrap content-start gap-2">
      {(isEditing ? draft.skills : profile.skills).map((skill) => (
        <span
          key={skill}
          className="inline-flex h-fit items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700"
        >
          {skill}

          {isEditing && (
            <button
              type="button"
              aria-label={`Remove ${skill}`}
              onClick={() => removeSkill(skill)}
              className="rounded text-slate-500 transition hover:text-rose-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}

      {!(isEditing ? draft.skills : profile.skills).length && (
        <p className="text-sm text-slate-500">No skills added yet.</p>
      )}
    </div>

    {isEditing && (
      <div className="mt-5 border-t border-slate-100 pt-5">
        <label
          htmlFor="newSkill"
          className="text-sm font-medium text-slate-700"
        >
          Add skill
        </label>

        <div className="mt-2 flex gap-2">
          <input
            id="newSkill"
            type="text"
            value={newSkill}
            onChange={(event) => setNewSkill(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addSkill();
              }
            }}
            placeholder="e.g. Python"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
          />

          <button
            type="button"
            onClick={addSkill}
            aria-label="Add skill"
            className="btn h-10 w-10 shrink-0"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    )}
  </section>);
}
