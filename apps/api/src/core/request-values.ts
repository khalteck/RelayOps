export function routeParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export function queryText(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function queryList(value: unknown): string[] | undefined {
  const text = queryText(value);
  return text ? text.split(",").filter(Boolean) : undefined;
}

export function queryNumber(value: unknown): number | undefined {
  const text = queryText(value);
  if (!text) return undefined;
  const result = Number(text);
  return Number.isFinite(result) ? result : undefined;
}
