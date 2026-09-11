import "server-only";

import { model, models, Schema } from "mongoose";

const opportunitySchema = new Schema(
  {
    organisation: { type: String, required: true, trim: true, maxlength: 160 },
    role: { type: String, required: true, trim: true, maxlength: 200 },
    location: { type: String, required: true, trim: true, maxlength: 160 },
    closingDate: { type: String, required: true, trim: true, maxlength: 80 },
    status: { type: String, enum: ["Published", "Draft", "Closed"], default: "Draft" },
    applications: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const OpportunityModel = models.Opportunity || model("Opportunity", opportunitySchema);