import "server-only";

import { model, models, Schema } from "mongoose";

const opportunitySchema = new Schema(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
    description: { type: String, default: "", maxlength: 20000 },
    employmentType: {
      type: String,
      enum: ["Internship", "Graduate", "Part-time"],
      default: "Internship",
    },
    workMode: {
      type: String,
      enum: ["On-site", "Hybrid", "Remote"],
      default: "On-site",
    },
    applicationUrl: { type: String, default: "", maxlength: 2000 },
    organisation: { type: String, required: true, trim: true, maxlength: 160 },
    role: { type: String, required: true, trim: true, maxlength: 200 },
    location: { type: String, required: true, trim: true, maxlength: 160 },
    closingDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    status: {
      type: String,
      enum: ["Published", "Draft", "Closed"],
      default: "Draft",
    },
  },
  { timestamps: true },
);

export const OpportunityModel =
  models.Opportunity || model("Opportunity", opportunitySchema);
