import "server-only";

import { model, models, Schema } from "mongoose";

const resourceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", maxlength: 2000 },
    category: { type: String, required: true, trim: true, maxlength: 120 },
    type: { type: String, enum: ["Guide", "Article", "Video", "Template"], required: true },
    featured: { type: Boolean, default: false },
    source: { type: String, default: "Internship Tracker", trim: true, maxlength: 160 },
    url: { type: String, default: "", trim: true, maxlength: 2000 },
    status: { type: String, enum: ["Published", "Draft"], default: "Draft" },
  },
  { timestamps: true }
);

export const ResourceModel = models.Resource || model("Resource", resourceSchema);