"use client";
import { ProfileField, ProfileSection } from "@/components/profile/ProfileFields";
import { ProfileData } from "@/components/profile/profileTypes";
import {
  UserRound
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
export default function PersonalDetails({ profile, draft, isEditing, setDraft, fullNameError, emailError, setFullNameError, setEmailError }: { profile: ProfileData; draft: ProfileData; isEditing: boolean; setDraft: Dispatch<SetStateAction<ProfileData>>; fullNameError: string; emailError: string; setFullNameError: (value: string) => void; setEmailError: (value: string) => void }) {
  return (<ProfileSection
    icon={<UserRound className="h-5 w-5" />}
    title="Personal information"
    description="Basic information linked to your student account."
  >
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <ProfileField
        label="Full name"
        value={draft.fullName}
        displayValue={profile.fullName}
        editing={isEditing}
        error={fullNameError}
        onChange={(value) => {
          setDraft((current) => ({
            ...current,
            fullName: value,
          }));

          if (fullNameError) {
            setFullNameError("");
          }
        }}
      />

      <ProfileField
        label="Email address (read-only)"
        value={draft.email}
        displayValue={profile.email}
        editing={false}
        error={emailError}
        type="email"
        onChange={(value) => {
          setDraft((current) => ({
            ...current,
            email: value,
          }));

          if (emailError) {
            setEmailError("");
          }
        }}
      />

      <ProfileField
        label="Location"
        value={draft.location}
        displayValue={profile.location}
        editing={isEditing}
        placeholder="e.g. Auckland, New Zealand"
        onChange={(value) =>
          setDraft((current) => ({
            ...current,
            location: value,
          }))
        }
      />
    </div>
  </ProfileSection>);
}
