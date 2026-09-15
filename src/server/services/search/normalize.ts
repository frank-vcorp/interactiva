export function normalizeToken(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function tokensMatch(a: string | null, b: string | null): boolean {
  const na = normalizeToken(a);
  const nb = normalizeToken(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

export function scoreRelevance(
  query: string,
  fields: Array<string | null | undefined>,
): number {
  const q = normalizeToken(query);
  if (!q) return 0;
  const qParts = q.split(/\s+/).filter(Boolean);
  let score = 0;

  for (const field of fields) {
    const f = normalizeToken(field);
    if (!f) continue;
    for (const part of qParts) {
      if (f.includes(part)) score += part.length;
      if (f === part) score += part.length * 2;
    }
  }

  return score;
}
