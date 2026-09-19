import { z } from "zod";

const items = z.array(z.string().trim().min(1).max(1200)).min(1).max(8);
export const aiSchemas = {
  "interview-prep": z.object({ interviewQuestions: items, skillsToHighlight: items, preparationTips: items, questionsForEmployer: items }).strict(),
  "application-insights": z.object({ strengths: items, areasToPrepare: items, applicationTips: items, preparationChecklist: items }).strict(),
};
export type AIFeature = keyof typeof aiSchemas;
export type AIResult = z.infer<(typeof aiSchemas)[AIFeature]>;
export const aiLabels: Record<string, string> = {
  interviewQuestions: "Interview questions", skillsToHighlight: "Skills to highlight",
  preparationTips: "Preparation tips", questionsForEmployer: "Questions for the employer",
  strengths: "Strengths", areasToPrepare: "Areas to prepare", applicationTips: "Application tips",
  preparationChecklist: "Preparation checklist",
};
