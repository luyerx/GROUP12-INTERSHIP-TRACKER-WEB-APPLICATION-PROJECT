import "server-only";

import { model, models, Schema } from "mongoose";

const sessionSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

export const SessionModel =
  models.Session ||
  model("Session", sessionSchema);