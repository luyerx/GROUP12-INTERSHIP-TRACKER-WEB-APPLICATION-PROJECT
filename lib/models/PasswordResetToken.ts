import "server-only";

import { model, models, Schema } from "mongoose";

const passwordResetTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    usable: { type: Boolean, required: true, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetTokenModel =
  models.PasswordResetToken || model("PasswordResetToken", passwordResetTokenSchema);