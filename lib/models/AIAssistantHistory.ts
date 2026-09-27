import "server-only";

import { model, models, Schema } from "mongoose";

const aiAssistantHistorySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    applicationId: {
      type: String,
      required: true,
      trim: true,
    },
    feature: {
      type: String,
      enum: ["interview-prep", "application-insights"],
      required: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
      default: "gemini-3.5-flash",
    },
    result: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

aiAssistantHistorySchema.index({ userId: 1, createdAt: -1 });

export const AIAssistantHistoryModel = models.AIAssistantHistory || model("AIAssistantHistory", aiAssistantHistorySchema);
