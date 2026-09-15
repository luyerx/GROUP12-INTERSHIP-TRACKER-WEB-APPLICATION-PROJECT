"use client";
import { ProfileField, ProfileSection } from "@/components/profile/ProfileFields";
import { ProfileData } from "@/components/profile/profileTypes";
import {
  GraduationCap
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
export default function EducationDetails({ profile, draft, isEditing, setDraft, graduationYearError, setGraduationYearError }: { profile: ProfileData; draft: ProfileData; isEditing: boolean; setDraft: Dispatch<SetStateAction<ProfileData>>; graduationYearError: string; setGraduationYearError: (value: string) => void }) {
  return (<ProfileSection
    icon={<GraduationCap className="h-5 w-5" />}
    title="Academic information"
    description="Your current study background and expected graduation."
  >
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <ProfileField
        label="University"
        value={draft.university}
        displayValue={profile.university}
        editing={isEditing}
        placeholder="University name"
        onChange={(value) =>
          setDraft((current) => ({
            ...current,
            university: value,
          }))
        }
      />

      <ProfileField
        label="Degree"
        value={draft.degree}
        displayValue={profile.degree}
        editing={isEditing}
        placeholder="e.g. Bachelor's Degree"
        onChange={(value) =>
          setDraft((current) => ({
            ...current,
            degree: value,
          }))
        }
      />

      <ProfileField
        label="Major"
        value={draft.major}
        displayValue={profile.major}
        editing={isEditing}
        placeholder="e.g. Software Engineering"
        onChange={(value) =>
          setDraft((current) => ({
            ...current,
            major: value,
          }))
        }
      />

      <ProfileField
        label="Graduation year"
        value={draft.graduationYear}
        displayValue={profile.graduationYear}
        editing={isEditing}
        error={graduationYearError}
        placeholder="e.g. 2026"
        onChange={(value) => {
          setDraft((current) => ({
            ...current,
            graduationYear: value,
          }));

          if (graduationYearError) {
            setGraduationYearError("");
          }
        }}
      />
    </div>
  </ProfileSection>);
}
