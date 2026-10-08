"use client";
import ProfileCompletion from "@/components/profile/ProfileCompletion";

import NotificationSettings from "@/components/profile/NotificationSettings";

import SkillsSection from "@/components/profile/SkillsSection";

import CareerPreferences from "@/components/profile/CareerPreferences";

import EducationDetails from "@/components/profile/EducationDetails";

import PersonalDetails from "@/components/profile/PersonalDetails";

import { ProfileData } from "@/components/profile/profileTypes";

import PageHeader from "@/components/ui/PageHeader";

import { useEffect, useMemo, useState } from "react";

import {
  CheckCircle2,
  GraduationCap,
  LoaderCircle,
  MapPin,
  Pencil,
  Save,
  X
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { ProfileBadge } from "@/components/profile/ProfileFields";
import { SuccessFeedback } from "@/components/ui/Feedback";



type CurrentUser = {
  fullName: string;
  email: string;
  university: string;
  degree: string;
  major: string;
  graduationYear: string;
  location: string;
  preferredRoles: string[];
  preferredLocations: string[];
  skills: string[];
  notifications: {
    email: boolean;
    deadlineReminders: boolean;
    interviewReminders: boolean;
  };
};

const emptyProfile: ProfileData = {
  fullName: "",
  email: "",
  university: "",
  degree: "",
  major: "",
  graduationYear: "",
  location: "",
  preferredRoles: "",
  preferredLocations: "",
  skills: [],
  emailNotifications: true,
  deadlineReminders: true,
  interviewReminders: true,
};

function toProfileData(user: CurrentUser): ProfileData {
  return {
    fullName: user.fullName,
    email: user.email,
    university: user.university,
    degree: user.degree,
    major: user.major,
    graduationYear: user.graduationYear,
    location: user.location,
    preferredRoles: user.preferredRoles.join(", "),
    preferredLocations: user.preferredLocations.join(", "),
    skills: [...user.skills],
    emailNotifications: user.notifications.email,
    deadlineReminders: user.notifications.deadlineReminders,
    interviewReminders: user.notifications.interviewReminders,
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);

  const [draft, setDraft] = useState<ProfileData>(emptyProfile);

  const [isLoading, setIsLoading] = useState(true);

  const [profileError, setProfileError] = useState("");

  const [isEditing, setIsEditing] = useState(false);

  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newSkill, setNewSkill] = useState("");

  const [fullNameError, setFullNameError] = useState("");

  const [emailError, setEmailError] = useState("");

  const [graduationYearError, setGraduationYearError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const result: {
          success: boolean;
          user?: CurrentUser;
          message?: string;
        } = await response.json();

        if (!response.ok || !result.success || !result.user) {
          throw new Error(result.message || "Unable to load profile.");
        }

        if (!cancelled) {
          const data = toProfileData(result.user);
          setProfile(data);
          setDraft(data);
        }
      } catch (error) {
        if (!cancelled) {
          setProfileError(
            error instanceof Error ? error.message : "Unable to load profile.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const initials = useMemo(() => {
    return profile.fullName
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [profile.fullName]);

  const profileCompletion = useMemo(() => {
    const fields = [
      profile.fullName,
      profile.email,
      profile.university,
      profile.degree,
      profile.major,
      profile.graduationYear,
      profile.location,
      profile.preferredRoles,
      profile.preferredLocations,
    ];

    const completedFields = fields.filter(
      (field) => field.trim().length > 0,
    ).length;

    const skillsComplete = profile.skills.length > 0 ? 1 : 0;

    const totalItems = fields.length + 1;

    return Math.round(((completedFields + skillsComplete) / totalItems) * 100);
  }, [profile]);

  const startEditing = () => {
    setDraft(profile);
    setNewSkill("");
    setFullNameError("");
    setEmailError("");
    setGraduationYearError("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft(profile);
    setNewSkill("");
    setFullNameError("");
    setEmailError("");
    setGraduationYearError("");
    setIsEditing(false);
  };

  const validateProfile = () => {
    let isValid = true;

    setFullNameError("");
    setEmailError("");
    setGraduationYearError("");

    if (!draft.fullName.trim()) {
      setFullNameError("Full name is required.");
      isValid = false;
    }

    if (!draft.email.trim()) {
      setEmailError("Email is required.");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
      setEmailError("Please enter a valid email address.");
      isValid = false;
    }

    if (draft.graduationYear && !/^\d{4}$/.test(draft.graduationYear)) {
      setGraduationYearError("Please enter a valid 4-digit year.");
      isValid = false;
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!validateProfile()) {
      return;
    }

    setSaved(false);
    setIsSaving(true);
    setProfileError("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: draft.fullName,
          email: draft.email,
          university: draft.university,
          degree: draft.degree,
          major: draft.major,
          graduationYear: draft.graduationYear,
          location: draft.location,
          preferredRoles: draft.preferredRoles
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          preferredLocations: draft.preferredLocations
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          skills: draft.skills,
          openToInternships: true,
          emailNotifications: draft.emailNotifications,
          deadlineReminders: draft.deadlineReminders,
          interviewReminders: draft.interviewReminders,
        }),
      });
      const result: { success: boolean; user?: CurrentUser; message?: string } =
        await response.json();

      if (!response.ok || !result.success || !result.user) {
        throw new Error(result.message || "Unable to save profile.");
      }

      const savedProfile = toProfileData(result.user);
      setProfile(savedProfile);
      setDraft(savedProfile);
      setIsEditing(false);
      setSaved(true);
    } catch (error) {
      console.error("Save profile error:", error);
      setProfileError(
        error instanceof Error ? error.message : "Unable to save profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const addSkill = () => {
    const skill = newSkill.trim();

    if (!skill) {
      return;
    }

    const exists = draft.skills.some(
      (currentSkill) => currentSkill.toLowerCase() === skill.toLowerCase(),
    );

    if (exists) {
      setNewSkill("");
      return;
    }

    setDraft((current) => ({
      ...current,
      skills: [...current.skills, skill],
    }));

    setNewSkill("");
  };

  const removeSkill = (skillToRemove: string) => {
    setDraft((current) => ({
      ...current,
      skills: current.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  return (
    <DashboardLayout>
      <div className="profile-content mx-auto max-w-6xl">
        {profileError && (
          <p
            role="alert"
            className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {profileError}
          </p>
        )}

        {isLoading && (
          <p className="mb-5 text-sm text-slate-500">Loading profile...</p>
        )}

        {saved && !isEditing && (
          <div className="mb-5">
            <SuccessFeedback>
              Profile saved. Your career details are up to date.
            </SuccessFeedback>
          </div>
        )}
        {/* Page header */}
        <PageHeader eyebrow="Student account" title="Your career profile" description="Tell your story. Keep your experience, interests and preferences ready for your next opportunity." action={!isEditing ? (
          <button
            type="button"
            disabled={isLoading || Boolean(profileError)}
            onClick={() => {
              setSaved(false);
              startEditing();
            }}
            className="btn "
          >
            <Pencil className="h-4 w-4" />
            Edit profile
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={cancelEditing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => void handleSave()}
              className="btn min-w-32 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save changes
                </>
              )}
            </button>
          </div>
        )} />

        {/* Profile summary */}
        <section className="mt-8 overflow-hidden card">
          <div className="p-6 sm:p-7">
            <div className="flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-xl font-semibold text-white shadow-sm">
                  {initials || "ST"}
                </div>

                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-slate-950">
                    {profile.fullName}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">{profile.email}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.major && (
                      <ProfileBadge
                        icon={<GraduationCap className="h-3.5 w-3.5" />}
                      >
                        {profile.major}
                      </ProfileBadge>
                    )}

                    {profile.graduationYear && (
                      <ProfileBadge>
                        Graduating {profile.graduationYear}
                      </ProfileBadge>
                    )}

                    {profile.location && (
                      <ProfileBadge icon={<MapPin className="h-3.5 w-3.5" />}>
                        {profile.location}
                      </ProfileBadge>
                    )}

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Open to internships
                    </span>
                  </div>
                </div>
              </div>

              {/* Completion */}
              <ProfileCompletion profileCompletion={profileCompletion} />
            </div>
          </div>
        </section>

        {/* Main layout */}
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          {/* Left column */}
          <div className="space-y-6">
            {/* Personal */}
            <PersonalDetails profile={profile} draft={draft} isEditing={isEditing} setDraft={setDraft} fullNameError={fullNameError} emailError={emailError} setFullNameError={setFullNameError} setEmailError={setEmailError} />

            {/* Academic */}
            <EducationDetails profile={profile} draft={draft} isEditing={isEditing} setDraft={setDraft} graduationYearError={graduationYearError} setGraduationYearError={setGraduationYearError} />

            {/* Career */}
            <CareerPreferences profile={profile} draft={draft} isEditing={isEditing} setDraft={setDraft} />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Skills */}
            <SkillsSection profile={profile} draft={draft} isEditing={isEditing} newSkill={newSkill} setNewSkill={setNewSkill} addSkill={addSkill} removeSkill={removeSkill} />

            {/* Notifications */}
            <NotificationSettings profile={profile} draft={draft} isEditing={isEditing} setDraft={setDraft} />

            {/* Account status */}
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200">
                  <CheckCircle2 className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                    Account status
                  </p>

                  <h2 className="mt-1 text-base font-semibold text-slate-950">
                    Student account active
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Your workspace is ready to manage internship applications,
                    deadlines, interviews, and career planning information.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
