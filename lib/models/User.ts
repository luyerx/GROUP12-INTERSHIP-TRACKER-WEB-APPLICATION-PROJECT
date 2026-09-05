import "server-only";

import { model, models, Schema } from "mongoose";

export const userRoles = ["student", "admin"] as const;

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
  },
  {
    timestamps: true,
  }
);

export const UserModel =
  models.User || model("User", userSchema);