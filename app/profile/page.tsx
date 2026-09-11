"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  Save,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";

type ProfileData = {
  fullName: string;
  email: string;
  university: string;
  degree: string;
  major: string;
  graduationYear: string;
  location: string;
  preferredRoles: string;
  preferredLocations: string;
  skills: string[];
  emailNotifications: boolean;
  deadlineReminders: boolean;
  interviewReminders: boolean;
};

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
  const [profile, setProfile] =
    useState<ProfileData>(emptyProfile);

  const [draft, setDraft] =
    useState<ProfileData>(emptyProfile);

  const [isLoading, setIsLoading] =
    useState(true);

  const [profileError, setProfileError] =
    useState("");

  const [isEditing, setIsEditing] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [newSkill, setNewSkill] =
    useState("");

  const [fullNameError, setFullNameError] =
    useState("");

  const [emailError, setEmailError] =
    useState("");

  const [
    graduationYearError,
    setGraduationYearError,
  ] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const result: { success: boolean; user?: CurrentUser; message?: string } = await response.json();

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
          setProfileError(error instanceof Error ? error.message : "Unable to load profile.");
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

  const profileCompletion =
    useMemo(() => {
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

      const completedFields =
        fields.filter(
          (field) => field.trim().length > 0
        ).length;

      const skillsComplete =
        profile.skills.length > 0 ? 1 : 0;

      const totalItems =
        fields.length + 1;

      return Math.round(
        ((completedFields +
          skillsComplete) /
          totalItems) *
          100
      );
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
      setFullNameError(
        "Full name is required."
      );
      isValid = false;
    }

    if (!draft.email.trim()) {
      setEmailError(
        "Email is required."
      );
      isValid = false;
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        draft.email
      )
    ) {
      setEmailError(
        "Please enter a valid email address."
      );
      isValid = false;
    }

    if (
      draft.graduationYear &&
      !/^\d{4}$/.test(
        draft.graduationYear
      )
    ) {
      setGraduationYearError(
        "Please enter a valid 4-digit year."
      );
      isValid = false;
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!validateProfile()) {
      return;
    }

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
          preferredRoles: draft.preferredRoles.split(",").map((value) => value.trim()).filter(Boolean),
          preferredLocations: draft.preferredLocations.split(",").map((value) => value.trim()).filter(Boolean),
          skills: draft.skills,
          openToInternships: true,
          emailNotifications: draft.emailNotifications,
          deadlineReminders: draft.deadlineReminders,
          interviewReminders: draft.interviewReminders,
        }),
      });
      const result: { success: boolean; user?: CurrentUser; message?: string } = await response.json();

      if (!response.ok || !result.success || !result.user) {
        throw new Error(result.message || "Unable to save profile.");
      }

      const savedProfile = toProfileData(result.user);
      setProfile(savedProfile);
      setDraft(savedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error("Save profile error:", error);
      setProfileError(error instanceof Error ? error.message : "Unable to save profile.");
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
      (currentSkill) =>
        currentSkill.toLowerCase() ===
        skill.toLowerCase()
    );

    if (exists) {
      setNewSkill("");
      return;
    }

    setDraft((current) => ({
      ...current,
      skills: [
        ...current.skills,
        skill,
      ],
    }));

    setNewSkill("");
  };

  const removeSkill = (
    skillToRemove: string
  ) => {
    setDraft((current) => ({
      ...current,
      skills: current.skills.filter(
        (skill) =>
          skill !== skillToRemove
      ),
    }));
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        {profileError && (
          <p className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {profileError}
          </p>
        )}

        {isLoading && (
          <p className="mb-5 text-sm text-slate-500">Loading profile...</p>
        )}

        {/* Page header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Student account
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Profile
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage your personal
              information, academic
              background, career
              preferences, skills, and
              notification settings.
            </p>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
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
                onClick={() =>
                  void handleSave()
                }
                className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
          )}
        </div>

        {/* Profile summary */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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

                  <p className="mt-1 text-sm text-slate-500">
                    {profile.email}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.major && (
                      <ProfileBadge
                        icon={
                          <GraduationCap className="h-3.5 w-3.5" />
                        }
                      >
                        {profile.major}
                      </ProfileBadge>
                    )}

                    {profile.graduationYear && (
                      <ProfileBadge>
                        Graduating{" "}
                        {
                          profile.graduationYear
                        }
                      </ProfileBadge>
                    )}

                    {profile.location && (
                      <ProfileBadge
                        icon={
                          <MapPin className="h-3.5 w-3.5" />
                        }
                      >
                        {
                          profile.location
                        }
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
              <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 xl:w-72">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
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

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-slate-950 transition-all duration-300"
                    style={{
                      width: `${profileCompletion}%`,
                    }}
                  />
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Keep your profile complete
                  to maintain an organised
                  career workspace.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main layout */}
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          {/* Left column */}
          <div className="space-y-6">
            {/* Personal */}
            <ProfileSection
              icon={
                <UserRound className="h-5 w-5" />
              }
              title="Personal information"
              description="Basic information linked to your student account."
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <ProfileField
                  label="Full name"
                  value={draft.fullName}
                  displayValue={
                    profile.fullName
                  }
                  editing={isEditing}
                  error={fullNameError}
                  onChange={(value) => {
                    setDraft(
                      (current) => ({
                        ...current,
                        fullName: value,
                      })
                    );

                    if (
                      fullNameError
                    ) {
                      setFullNameError(
                        ""
                      );
                    }
                  }}
                />

                <ProfileField
                  label="Email address"
                  value={draft.email}
                  displayValue={
                    profile.email
                  }
                  editing={isEditing}
                  error={emailError}
                  type="email"
                  onChange={(value) => {
                    setDraft(
                      (current) => ({
                        ...current,
                        email: value,
                      })
                    );

                    if (emailError) {
                      setEmailError("");
                    }
                  }}
                />

                <ProfileField
                  label="Location"
                  value={draft.location}
                  displayValue={
                    profile.location
                  }
                  editing={isEditing}
                  placeholder="e.g. Auckland, New Zealand"
                  onChange={(value) =>
                    setDraft(
                      (current) => ({
                        ...current,
                        location: value,
                      })
                    )
                  }
                />
              </div>
            </ProfileSection>

            {/* Academic */}
            <ProfileSection
              icon={
                <GraduationCap className="h-5 w-5" />
              }
              title="Academic information"
              description="Your current study background and expected graduation."
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <ProfileField
                  label="University"
                  value={
                    draft.university
                  }
                  displayValue={
                    profile.university
                  }
                  editing={isEditing}
                  placeholder="University name"
                  onChange={(value) =>
                    setDraft(
                      (current) => ({
                        ...current,
                        university:
                          value,
                      })
                    )
                  }
                />

                <ProfileField
                  label="Degree"
                  value={draft.degree}
                  displayValue={
                    profile.degree
                  }
                  editing={isEditing}
                  placeholder="e.g. Bachelor's Degree"
                  onChange={(value) =>
                    setDraft(
                      (current) => ({
                        ...current,
                        degree: value,
                      })
                    )
                  }
                />

                <ProfileField
                  label="Major"
                  value={draft.major}
                  displayValue={
                    profile.major
                  }
                  editing={isEditing}
                  placeholder="e.g. Software Engineering"
                  onChange={(value) =>
                    setDraft(
                      (current) => ({
                        ...current,
                        major: value,
                      })
                    )
                  }
                />

                <ProfileField
                  label="Graduation year"
                  value={
                    draft.graduationYear
                  }
                  displayValue={
                    profile.graduationYear
                  }
                  editing={isEditing}
                  error={
                    graduationYearError
                  }
                  placeholder="e.g. 2026"
                  onChange={(value) => {
                    setDraft(
                      (current) => ({
                        ...current,
                        graduationYear:
                          value,
                      })
                    );

                    if (
                      graduationYearError
                    ) {
                      setGraduationYearError(
                        ""
                      );
                    }
                  }}
                />
              </div>
            </ProfileSection>

            {/* Career */}
            <ProfileSection
              icon={
                <BriefcaseBusiness className="h-5 w-5" />
              }
              title="Career preferences"
              description="Set the roles and locations you are most interested in."
            >
              <div className="space-y-5">
                <ProfileField
                  label="Preferred roles"
                  value={
                    draft.preferredRoles
                  }
                  displayValue={
                    profile.preferredRoles
                  }
                  editing={isEditing}
                  placeholder="e.g. Software Engineer, Frontend Developer"
                  onChange={(value) =>
                    setDraft(
                      (current) => ({
                        ...current,
                        preferredRoles:
                          value,
                      })
                    )
                  }
                />

                <ProfileField
                  label="Preferred locations"
                  value={
                    draft.preferredLocations
                  }
                  displayValue={
                    profile.preferredLocations
                  }
                  editing={isEditing}
                  placeholder="e.g. Auckland, Wellington, Remote"
                  onChange={(value) =>
                    setDraft(
                      (current) => ({
                        ...current,
                        preferredLocations:
                          value,
                      })
                    )
                  }
                />
              </div>
            </ProfileSection>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Skills */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">
                    Skills
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Technical and
                    professional strengths
                    relevant to your career.
                  </p>
                </div>

                <div className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                  {
                    (isEditing
                      ? draft.skills
                      : profile.skills
                    ).length
                  }{" "}
                  skills
                </div>
              </div>

              <div className="mt-5 flex min-h-20 flex-wrap content-start gap-2">
                {(isEditing
                  ? draft.skills
                  : profile.skills
                ).map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex h-fit items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700"
                  >
                    {skill}

                    {isEditing && (
                      <button
                        type="button"
                        aria-label={`Remove ${skill}`}
                        onClick={() =>
                          removeSkill(
                            skill
                          )
                        }
                        className="rounded text-slate-400 transition hover:text-rose-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}

                {!(
                  isEditing
                    ? draft.skills
                    : profile.skills
                ).length && (
                  <p className="text-sm text-slate-400">
                    No skills added yet.
                  </p>
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
                      onChange={(
                        event
                      ) =>
                        setNewSkill(
                          event.target
                            .value
                        )
                      }
                      onKeyDown={(
                        event
                      ) => {
                        if (
                          event.key ===
                          "Enter"
                        ) {
                          event.preventDefault();
                          addSkill();
                        }
                      }}
                      placeholder="e.g. Python"
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                    />

                    <button
                      type="button"
                      onClick={addSkill}
                      aria-label="Add skill"
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white transition hover:bg-slate-800"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Notifications */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Bell className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-slate-950">
                    Notifications
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Manage important
                    reminders.
                  </p>
                </div>
              </div>

              {!isEditing && (
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                  <p className="text-xs leading-5 text-slate-500">
                    Notification settings
                    can be changed while
                    editing your profile.
                  </p>
                </div>
              )}

              <div className="mt-5 divide-y divide-slate-100">
                <NotificationSetting
                  title="Email notifications"
                  description="Receive important account and application updates by email."
                  checked={
                    isEditing
                      ? draft.emailNotifications
                      : profile.emailNotifications
                  }
                  disabled={!isEditing}
                  onChange={(value) =>
                    setDraft(
                      (current) => ({
                        ...current,
                        emailNotifications:
                          value,
                      })
                    )
                  }
                />

                <NotificationSetting
                  title="Deadline reminders"
                  description="Get reminders before internship application deadlines."
                  checked={
                    isEditing
                      ? draft.deadlineReminders
                      : profile.deadlineReminders
                  }
                  disabled={!isEditing}
                  onChange={(value) =>
                    setDraft(
                      (current) => ({
                        ...current,
                        deadlineReminders:
                          value,
                      })
                    )
                  }
                />

                <NotificationSetting
                  title="Interview reminders"
                  description="Receive reminders before scheduled interviews."
                  checked={
                    isEditing
                      ? draft.interviewReminders
                      : profile.interviewReminders
                  }
                  disabled={!isEditing}
                  onChange={(value) =>
                    setDraft(
                      (current) => ({
                        ...current,
                        interviewReminders:
                          value,
                      })
                    )
                  }
                />
              </div>
            </section>

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
                    Your workspace is ready
                    to manage internship
                    applications, deadlines,
                    interviews, and career
                    planning information.
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

type ProfileSectionProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
};

function ProfileSection({
  icon,
  title,
  description,
  children,
}: ProfileSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icon}
        </div>

        <div>
          <h2 className="text-base font-semibold text-slate-950">
            {title}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-6">
        {children}
      </div>
    </section>
  );
}

type ProfileBadgeProps = {
  children: React.ReactNode;
  icon?: React.ReactNode;
};

function ProfileBadge({
  children,
  icon,
}: ProfileBadgeProps) {
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

function ProfileField({
  label,
  value,
  displayValue,
  editing,
  onChange,
  error,
  type = "text",
  placeholder,
}: ProfileFieldProps) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      {editing ? (
        <>
          <input
            type={type}
            value={value}
            onChange={(event) =>
              onChange(
                event.target.value
              )
            }
            placeholder={placeholder}
            className={`mt-2 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
              error
                ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"
            }`}
          />

          {error && (
            <p className="mt-2 text-xs font-medium text-rose-600">
              {error}
            </p>
          )}
        </>
      ) : (
        <p className="mt-2 text-sm font-medium leading-6 text-slate-800">
          {displayValue ||
            "Not provided"}
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

function NotificationSetting({
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
        <p className="text-sm font-medium text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        onClick={() =>
          onChange(!checked)
        }
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
          checked
            ? "bg-slate-950"
            : "bg-slate-200"
        } ${
          disabled
            ? "cursor-not-allowed"
            : "cursor-pointer hover:opacity-90"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>
    </div>
  );
}