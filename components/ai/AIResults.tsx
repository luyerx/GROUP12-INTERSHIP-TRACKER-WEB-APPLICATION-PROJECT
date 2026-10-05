import Link from "next/link";
import { aiLabels, aiSchemas, type AIFeature } from "@/lib/ai-contract";
import { formatAppDate } from "@/lib/date";

export type OpportunityCard = {
  opportunityId: string;
  role: string;
  organisation: string;
  location: string;
  closingDate: string;
  workMode: string;
  employmentType: string;
};
function Items({ values }: { values: string[] }) {
  return (
    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-600">
      {values.map((value, index) => (
        <li key={index}>{value}</li>
      ))}
    </ul>
  );
}
function OpportunityHeading({
  row,
  id,
}: {
  row?: OpportunityCard;
  id: string;
}) {
  return (
    <>
      <h3 className="text-lg font-semibold">
        {row?.role ?? "Previously recommended opportunity"}
      </h3>
      {row && (
        <>
          <p className="mt-1 text-sm text-slate-600">
            {row.organisation} · {row.location}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Closes {formatAppDate(row.closingDate)} · {row.employmentType} ·{" "}
            {row.workMode}
          </p>
        </>
      )}
      <Link
        className="mt-3 inline-block text-sm font-semibold text-teal-700 underline"
        href={`/opportunities/${id}`}
      >
        View Opportunity
      </Link>
    </>
  );
}
export default function AIResults({
  feature,
  result,
  opportunities = [],
  historical = false,
  totalResults,
}: {
  feature: AIFeature;
  result: unknown;
  opportunities?: OpportunityCard[];
  historical?: boolean;
  totalResults?: number;
}) {
  const parsed = aiSchemas[feature].safeParse(result);
  if (!parsed.success)
    return (
      <p role="alert">
        This saved result has an unsupported format. Please generate new
        guidance.
      </p>
    );
  if (feature === "opportunity-recommendation") {
    const data = aiSchemas[feature].parse(result);
    return (
      <section aria-label="AI guidance" className="space-y-4">
        <p className="text-sm text-slate-600">
          AI recommendations are guidance only and do not represent hiring
          probability.
        </p>
        {historical && (
          <p className="text-sm text-slate-600">
            These are saved recommendations. Opportunities may have changed or
            closed; links recheck access.
          </p>
        )}
        <div className="grid gap-4 lg:grid-cols-2">
          {data.recommendations.map((item) => (
            <article
              className="panel min-w-0 [overflow-wrap:anywhere]"
              key={item.opportunityId}
            >
              <OpportunityHeading
                id={item.opportunityId}
                row={opportunities.find(
                  (row) => row.opportunityId === item.opportunityId,
                )}
              />
              {(
                [
                  ["Why this may suit you", item.reasons],
                  ["Matching skills", item.matchingSkills],
                  ["Areas to prepare", item.preparationAreas],
                ] as const
              ).map(([label, values]) => (
                <div className="mt-5" key={label}>
                  <h4 className="font-semibold">{label}</h4>
                  <Items values={values} />
                </div>
              ))}
            </article>
          ))}
        </div>
        <article className="panel">
          <h3 className="font-semibold">Next steps</h3>
          <Items values={data.overallAdvice} />
        </article>
      </section>
    );
  }
  if (feature === "smart-search") {
    const data = aiSchemas[feature].parse(result);
    return (
      <section aria-label="AI guidance" className="space-y-4">
        <article className="panel">
          <h3 className="font-semibold">We understood your search as:</h3>
          <dl className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            {Object.entries({
              Keywords: data.keywords.join(", ") || "Any",
              Location: data.location || "Any",
              "Closing period":
                data.closingPeriod?.replaceAll("_", " ") || "Any upcoming date",
              "Work mode": data.workMode || "Any",
              "Role type": data.roleType || "Any",
            }).map(([key, value]) => (
              <div key={key}>
                <dt className="inline font-medium">{key}: </dt>
                <dd className="inline">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-slate-500">
            Closing periods use Pacific/Auckland; this week ends Sunday. All
            keywords must appear in the listing.
          </p>
        </article>
        {historical ? (
          <p className="text-sm text-slate-600">
            Saved search intent only. Run a new search for currently available
            opportunities.
          </p>
        ) : (
          <>
            {!opportunities.length && (
              <p className="panel">
                No opportunities matched this AI-assisted search.
              </p>
            )}
            {totalResults !== undefined &&
              totalResults > opportunities.length && (
                <p className="text-sm text-slate-600">
                  Showing the first {opportunities.length} of {totalResults}{" "}
                  results. Refine your search to narrow them down.
                </p>
              )}
            <div className="grid gap-4 lg:grid-cols-2">
              {opportunities.map((row) => (
                <article
                  className="panel min-w-0 [overflow-wrap:anywhere]"
                  key={row.opportunityId}
                >
                  <OpportunityHeading row={row} id={row.opportunityId} />
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    );
  }
  return (
    <section
      aria-label="AI guidance"
      className="grid min-w-0 gap-4 md:grid-cols-2"
    >
      {Object.entries(parsed.data).map(([key, value]) => (
        <article className="panel min-w-0 [overflow-wrap:anywhere]" key={key}>
          <h3 className="text-lg font-semibold">{aiLabels[key] ?? key}</h3>
          {typeof value === "string" ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {value}
            </p>
          ) : key === "wordingSuggestions" ? (
            <div className="mt-3 space-y-5">
              {aiSchemas["document-assistant"].parse(result).wordingSuggestions
                .length === 0 ? (
                <p className="text-sm text-slate-600">
                  No wording changes suggested.
                </p>
              ) : (
                aiSchemas["document-assistant"]
                  .parse(result)
                  .wordingSuggestions.map((item, i) => (
                    <div
                      key={i}
                      className="space-y-2 border-l-2 border-teal-600 pl-4 text-sm leading-6"
                    >
                      <p>
                        <strong>Original excerpt:</strong> {item.original}
                      </p>
                      <p>
                        <strong>Suggested wording:</strong> {item.suggestion}
                      </p>
                      <p className="text-slate-600">{item.reason}</p>
                    </div>
                  ))
              )}
            </div>
          ) : (
            <Items values={value as string[]} />
          )}
        </article>
      ))}
    </section>
  );
}
