export function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parsePositiveInt(value: string | string[] | undefined, fallback: number, options?: { min?: number; max?: number }) {
  const parsed = Number.parseInt(firstQueryValue(value) ?? "", 10);
  if (Number.isNaN(parsed)) return fallback;

  const min = options?.min ?? 1;
  const max = options?.max ?? Number.POSITIVE_INFINITY;
  return Math.min(max, Math.max(min, parsed));
}