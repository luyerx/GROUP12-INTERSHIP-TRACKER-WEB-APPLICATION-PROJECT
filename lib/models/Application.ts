import "server-only";

import { model, models, Schema } from "mongoose";
import { applicationStatuses } from "@/lib/application";

const applicationSchema = new Schema(
  {
    opportunityId: { type: Schema.Types.ObjectId, ref: "Opportunity" },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    organisation: { type: String, required: true, trim: true, maxlength: 120 },
    roleTitle: { type: String, required: true, trim: true, maxlength: 160 },
    location: { type: String, default: "", trim: true, maxlength: 120 },
    sourceLink: { type: String, default: "", trim: true },
    deadline: { type: String, default: "" },
    status: { type: String, enum: applicationStatuses, default: "Interested" },
    jobDescription: { type: String, default: "", maxlength: 20000 },
    contactPerson: { type: String, default: "", trim: true, maxlength: 160 },
    outcome: { type: String, default: "", trim: true, maxlength: 120 },
    notes: { type: String, default: "", maxlength: 10000 },
  },
  { timestamps: true },
);

// External applications have no opportunityId; existing records remain valid.
applicationSchema.index(
  { userId: 1, opportunityId: 1 },
  {
    unique: true,
    partialFilterExpression: { opportunityId: { $type: "objectId" } },
  },
);

export const ApplicationModel =
  models.Application || model("Application", applicationSchema);
