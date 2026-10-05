import { z } from "zod";
export const DOCUMENT_EXCERPT_MAX_CHARS = 160;
// Give short documents room for a useful excerpt, without quoting most of them.
export const documentExcerptBudget = (documentLength: number) => Math.min(
  Math.floor(documentLength / 2),
  Math.max(DOCUMENT_EXCERPT_MAX_CHARS, Math.floor(documentLength / 4)),
);

const items = z.array(z.string().trim().min(1).max(1200)).min(1).max(8);
const text = z.string().trim().min(1).max(1800);
export const aiFeatures = [
  "interview-prep",
  "application-insights",
  "application-summary",
  "opportunity-recommendation",
  "smart-search",
  "document-assistant",
] as const;
export const searchIntentSchema = z
  .object({
    keywords: z.array(z.string().trim().min(1).max(80)).max(8),
    location: z.string().trim().min(1).max(120).nullable(),
    closingPeriod: z.enum(["this_week", "this_month", "next_month"]).nullable(),
    workMode: z.enum(["On-site", "Hybrid", "Remote"]).nullable(),
    roleType: z.enum(["Internship", "Graduate", "Part-time"]).nullable(),
  })
  .strict();
export const documentInputSchema = z
  .object({
    applicationId: z.string().regex(/^[a-f\d]{24}$/i),
    documentType: z.enum(["resume", "cover-letter"]),
    documentText: z.string().trim().min(80).max(10000),
  })
  .strict();
export const aiSchemas = {
  "opportunity-recommendation": z
    .object({
      recommendations: z
        .array(
          z
            .object({
              opportunityId: z.string().regex(/^[a-f\d]{24}$/i),
              reasons: items,
              matchingSkills: items,
              preparationAreas: items,
            })
            .strict(),
        )
        .min(1)
        .max(5),
      overallAdvice: items,
    })
    .strict(),
  "smart-search": searchIntentSchema,
  "application-summary": z
    .object({
      roleSummary: text,
      keyResponsibilities: items,
      requiredSkills: items,
      importantDetails: items,
      deadlineSummary: text,
      preparationPriorities: items,
      studentStrengths: items,
      areasToPrepare: items,
    })
    .strict(),
  "document-assistant": z
    .object({
      summary: text,
      strengths: items,
      missingOrWeakAreas: items,
      wordingSuggestions: z
        .array(
          z
            .object({
              original: z.string().trim().min(1).max(DOCUMENT_EXCERPT_MAX_CHARS),
              suggestion: z.string().trim().min(1).max(500),
              reason: z.string().trim().min(1).max(500),
            })
            .strict(),
        )
        .max(3),
      roleAlignmentTips: items,
      finalChecklist: items,
    })
    .strict(),
  "interview-prep": z
    .object({
      interviewQuestions: items,
      skillsToHighlight: items,
      preparationTips: items,
      questionsForEmployer: items,
    })
    .strict(),
  "application-insights": z
    .object({
      strengths: items,
      areasToPrepare: items,
      applicationTips: items,
      preparationChecklist: items,
    })
    .strict(),
};
export type AIFeature = keyof typeof aiSchemas;
export type AIResult = z.infer<(typeof aiSchemas)[AIFeature]>;
export const aiFeatureTitles: Record<AIFeature, string> = {
  "interview-prep": "Interview Preparation",
  "application-insights": "Application Insights (legacy)",
  "application-summary": "Application Summary",
  "opportunity-recommendation": "Opportunity Recommendations",
  "smart-search": "Smart Opportunity Search",
  "document-assistant": "Document Assistant",
};
export const needsApplication = (feature: AIFeature) =>
  !["opportunity-recommendation", "smart-search"].includes(feature);
export const aiLabels: Record<string, string> = {
  roleSummary: "Role Overview",
  keyResponsibilities: "Key Responsibilities",
  requiredSkills: "Required Skills",
  importantDetails: "Important Details",
  deadlineSummary: "Deadline",
  preparationPriorities: "Preparation Priorities",
  studentStrengths: "Your Strengths",
  summary: "Document Overview",
  missingOrWeakAreas: "Missing or Weak Areas",
  wordingSuggestions: "Wording Suggestions",
  roleAlignmentTips: "Role Alignment Tips",
  finalChecklist: "Final Checklist",
  interviewQuestions: "Interview questions",
  skillsToHighlight: "Skills to highlight",
  preparationTips: "Preparation tips",
  questionsForEmployer: "Questions for the employer",
  strengths: "Strengths",
  areasToPrepare: "Areas to prepare",
  applicationTips: "Application tips",
  preparationChecklist: "Preparation checklist",
};
