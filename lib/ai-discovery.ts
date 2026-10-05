import { z } from "zod";
import { searchIntentSchema } from "@/lib/ai-contract";
import { aucklandDateKey } from "@/lib/aucklandTime";

export type AIOpportunity = {
  opportunityId: string;
  role: string;
  organisation: string;
  location: string;
  closingDate: string;
  description: string;
  workMode: string;
  employmentType: string;
};
export type CareerProfile = {
  skills: string[];
  degree: string;
  major: string;
  preferredRoles: string[];
  preferredLocations: string[];
};
const words = (value: string) =>
  [...new Set(value.toLowerCase().match(/[\p{L}\p{N}+#]+/gu) ?? [])].filter(
    (word) => word.length > 2,
  );
export function rankCandidates(
  rows: AIOpportunity[],
  profile: CareerProfile,
  history: { roleTitle: string }[],
) {
  const skills = words(profile.skills.join(" "));
  const roles = words(
    [...profile.preferredRoles, profile.degree, profile.major].join(" "),
  );
  const past = words(
    history
      .slice(0, 30)
      .map((row) => row.roleTitle)
      .join(" "),
  );
  return rows
    .map((row) => {
      const content = `${row.role} ${row.description}`.toLowerCase();
      const overlap = (terms: string[]) =>
        terms.filter((term) => content.includes(term)).length;
      const score =
        overlap(skills) * 3 +
        overlap(roles) * 2 +
        overlap(past) +
        (profile.preferredLocations.some((place) =>
          row.location.toLowerCase().includes(place.toLowerCase()),
        )
          ? 3
          : 0);
      return { row, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.row.closingDate.localeCompare(b.row.closingDate) ||
        a.row.opportunityId.localeCompare(b.row.opportunityId),
    )
    .slice(0, 15)
    .map(({ row }) => row);
}
export function closingRange(
  period: z.infer<typeof searchIntentSchema>["closingPeriod"],
  today = aucklandDateKey(),
) {
  const date = new Date(today + "T00:00:00Z");
  const key = (value: Date) => value.toISOString().slice(0, 10);
  if (period === "this_week") {
    date.setUTCDate(date.getUTCDate() + ((7 - date.getUTCDay()) % 7));
    return { start: today, end: key(date) };
  }
  if (period === "this_month")
    return {
      start: today,
      end: key(
        new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)),
      ),
    };
  if (period === "next_month")
    return {
      start: key(
        new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)),
      ),
      end: key(
        new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 2, 0)),
      ),
    };
  return { start: today, end: "9999-12-31" };
}
// Literal filters over the existing permission-filtered repository; AI never supplies a DB query.
export function searchOpportunities(
  rows: AIOpportunity[],
  input: z.infer<typeof searchIntentSchema>,
  today = aucklandDateKey(),
) {
  const intent = searchIntentSchema.parse(input);
  const range = closingRange(intent.closingPeriod, today);
  return rows
    .filter(
      (row) =>
        row.closingDate >= range.start &&
        row.closingDate <= range.end &&
        (!intent.location ||
          row.location.toLowerCase().includes(intent.location.toLowerCase())) &&
        (!intent.workMode || row.workMode === intent.workMode) &&
        (!intent.roleType || row.employmentType === intent.roleType) &&
        intent.keywords.every((word) =>
          `${row.role} ${row.organisation} ${row.description}`
            .toLowerCase()
            .includes(word.toLowerCase()),
        ),
    )
    .sort(
      (a, b) =>
        a.closingDate.localeCompare(b.closingDate) ||
        a.opportunityId.localeCompare(b.opportunityId),
    );
}
