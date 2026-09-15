"use client";
import { ProfileField, ProfileSection } from "@/components/profile/ProfileFields";
import { ProfileData } from "@/components/profile/profileTypes";
import {
  BriefcaseBusiness
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
export default function CareerPreferences({ profile, draft, isEditing, setDraft }: { profile: ProfileData; draft: ProfileData; isEditing: boolean; setDraft: Dispatch<SetStateAction<ProfileData>> }) {
  return (<ProfileSection
    icon={<BriefcaseBusiness className="h-5 w-5" />}
    title="Career preferences"
    description="Set the roles and locations you are most interested in."
  >
    <div className="space-y-5">
      <ProfileField
        label="Preferred roles"
        value={draft.preferredRoles}
        displayValue={profile.preferredRoles}
        editing={isEditing}
        placeholder="e.g. Software Engineer, Frontend Developer"
        onChange={(value) =>
          setDraft((current) => ({
            ...current,
            preferredRoles: value,
          }))
        }
      />

      <ProfileField
        label="Preferred locations"
        value={draft.preferredLocations}
        displayValue={profile.preferredLocations}
        editing={isEditing}
        placeholder="e.g. Auckland, Wellington, Remote"
        onChange={(value) =>
          setDraft((current) => ({
            ...current,
            preferredLocations: value,
          }))
        }
      />
    </div>
  </ProfileSection>);
}
