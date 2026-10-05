import { DOCUMENT_EXCERPT_MAX_CHARS, documentExcerptBudget } from "@/lib/ai-contract";

export function documentExcerptsWithinLimit(originals: string[], documentLength: number): boolean {
  return originals.every(original => original.trim().length <= DOCUMENT_EXCERPT_MAX_CHARS)
    && originals.reduce((sum, original) => sum + original.trim().length, 0) <= documentExcerptBudget(documentLength);
}

// These checks supplement the structured schema and task prompts; errors never include input.
export function hasOutcomeClaim(value: unknown): boolean {
  const text = JSON.stringify(value);
  return /\b\d+(?:\.\d+)?\s*(?:%|percent)\s*(?:match|fit|chance|probability|likelihood)|\b(?:match|fit)\s*(?:score|percentage)?\s*(?:of|is|:)?\s*\d+|\b(?:hiring|offer|acceptance|success)\s+(?:probability|rate|chance)|\bguaranteed?\s+(?:success|offer|job|employment)|\byou\s+(?:will|shall)\s+(?:get|secure|land)\s+(?:this|the|a)\s+(?:job|role|offer)/i.test(
    text,
  );
}
export function normalizeDocumentText(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function documentExcerptMatches(
  source: string,
  excerpt: string,
): boolean {
  // Whole ordered tokens, not edit-distance matching. Preserve negation, numbers,
  // qualifications and technical names (notably C++ / C#).
  const tokens = (value: string) =>
    normalizeDocumentText(value).match(
      /[\p{L}\p{N}]+(?:'[\p{L}\p{N}]+)*[+#]*/gu,
    ) ?? [];
  const sourceTokens = tokens(source),
    excerptTokens = tokens(excerpt);
  if (!excerptTokens.length) return false;
  const contains = (haystack: string[], needle: string[]) =>
    ` ${haystack.join(" ")} `.includes(` ${needle.join(" ")} `);
  if (contains(sourceTokens, excerptTokens)) return true;
  // The only grammatical relaxation is optional articles in a substantial phrase.
  // No stemming, synonyms, arbitrary insertions, substitutions or token reordering.
  const content = (values: string[]) =>
    values.filter((value) => !["a", "an", "the"].includes(value));
  const significant = content(excerptTokens);
  return (
    excerptTokens.length >= 5 &&
    significant.length >= 4 &&
    contains(content(sourceTokens), significant)
  );
}

export function documentEchoesInput(
  result: unknown,
  document: string,
): boolean {
  const strings = (value: unknown): string[] =>
    typeof value === "string"
      ? [value]
      : Array.isArray(value)
        ? value.flatMap(strings)
        : value && typeof value === "object"
          ? Object.values(value).flatMap(strings)
          : [];
  // originals are intentionally quoted, separately source-checked and bounded by
  // both schema and cumulative limits. Never concatenate them into the echo scan.
  const review =
    result && typeof result === "object" && !Array.isArray(result)
      ? Object.fromEntries(
          Object.entries(result).map(([key, value]) => [
            key,
            key === "wordingSuggestions" && Array.isArray(value)
              ? value.map((item) =>
                  item && typeof item === "object"
                    ? Object.fromEntries(
                        Object.entries(item).filter(
                          ([field]) => field !== "original",
                        ),
                      )
                    : item,
                )
              : value,
          ]),
        )
      : result;
  const source = normalizeDocumentText(document),
    target = normalizeDocumentText(strings(review).join(" "));
  if (!source.length) return false;
  // Short documents must still not be returned wholesale. For longer documents,
  // reject substantial passages rather than ordinary skills or resume phrases.
  const window = Math.min(
    source.length,
    source.length < 320
      ? Math.max(64, Math.ceil(source.length * 0.6))
      : Math.max(161, Math.min(400, Math.ceil(source.length / 4))),
  );
  for (let i = 0; i + window <= source.length; i++) {
    if (target.includes(source.slice(i, i + window))) return true;
  }
  return false;
}

export function redactContactDetails(value: string) {
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email removed]")
    .replace(/(?:\+?\d[\d ()-]{6,}\d)/g, (match) =>
      /\d{4}-\d{2}-\d{2}/.test(match) ? match : "[phone removed]",
    );
}
