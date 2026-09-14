import "server-only";

import { model, models, Schema } from "mongoose";

export const userRoles = ["student", "admin", "employee"] as const;
export const userStatuses = ["Active", "Suspended"] as const;

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 160,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: userRoles,
      default: "student",
    },

    status: {
      type: String,
      enum: userStatuses,
      default: "Active",
    },

    companyName: { type: String, default: "", trim: true, maxlength: 160 },
    companyWebsite: { type: String, default: "", trim: true, maxlength: 2000 },
    companyDescription: { type: String, default: "", maxlength: 4000 },
    university: {
      type: String,
      default: "",
      trim: true,
      maxlength: 160,
    },

    degree: {
      type: String,
      default: "",
      trim: true,
      maxlength: 160,
    },

    major: {
      type: String,
      default: "",
      trim: true,
      maxlength: 160,
    },

    graduationYear: {
      type: String,
      default: "",
      trim: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },

    preferredRoles: {
      type: [String],
      default: [],
    },

    preferredLocations: {
      type: [String],
      default: [],
    },

    skills: {
      type: [String],
      default: [],
    },

    openToInternships: {
      type: Boolean,
      default: true,
    },

    emailNotifications: {
      type: Boolean,
      default: true,
    },

    deadlineReminders: {
      type: Boolean,
      default: true,
    },

    interviewReminders: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const UserModel = models.User || model("User", userSchema);
