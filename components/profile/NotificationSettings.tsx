"use client";
import { NotificationSetting } from "@/components/profile/ProfileFields";
import { ProfileData } from "@/components/profile/profileTypes";
import {
  Bell
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
export default function NotificationSettings({ profile, draft, isEditing, setDraft }: { profile: ProfileData; draft: ProfileData; isEditing: boolean; setDraft: Dispatch<SetStateAction<ProfileData>> }) {
  return (<section className="card p-6">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <Bell className="h-5 w-5" />
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-950">
          Notifications
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Manage important reminders.
        </p>
      </div>
    </div>

    {!isEditing && (
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
        <p className="text-xs leading-5 text-slate-500">
          Notification settings can be changed while editing your
          profile.
        </p>
      </div>
    )}

    <div className="mt-5 divide-y divide-slate-100">
      <NotificationSetting
        title="Email notifications"
        description="Allow email reminders for application deadlines and interviews."
        checked={
          isEditing
            ? draft.emailNotifications
            : profile.emailNotifications
        }
        disabled={!isEditing}
        onChange={(value) =>
          setDraft((current) => ({
            ...current,
            emailNotifications: value,
          }))
        }
      />

      <NotificationSetting
        title="Deadline reminders"
        description="Email me before my tracked application deadlines (end of day in New Zealand / Auckland time)."
        checked={
          isEditing
            ? draft.deadlineReminders
            : profile.deadlineReminders
        }
        disabled={!isEditing}
        onChange={(value) =>
          setDraft((current) => ({
            ...current,
            deadlineReminders: value,
          }))
        }
      />

      <NotificationSetting
        title="Interview reminders"
        description="Email me before interviews with a valid New Zealand / Auckland time."
        checked={
          isEditing
            ? draft.interviewReminders
            : profile.interviewReminders
        }
        disabled={!isEditing}
        onChange={(value) =>
          setDraft((current) => ({
            ...current,
            interviewReminders: value,
          }))
        }
      />
    </div>
  </section>);
}
