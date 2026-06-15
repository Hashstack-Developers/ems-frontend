export const NO_CHANGES_MESSAGE = 'No changes detected';

export function isSameValue(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  if (a == null && b == null) {
    return true;
  }

  if (a == null || b == null) {
    return false;
  }

  if (typeof a === 'number' && typeof b === 'string') {
    return !Number.isNaN(Number(b)) && a === Number(b);
  }

  if (typeof b === 'number' && typeof a === 'string') {
    return !Number.isNaN(Number(a)) && b === Number(a);
  }

  return false;
}

export function normalizeOptionalString(value: string | null | undefined): string | undefined {
  const trimmed = (value ?? '').trim();
  return trimmed === '' ? undefined : trimmed;
}

export function optionalStringsEqual(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  return normalizeOptionalString(a) === normalizeOptionalString(b);
}

export function stringArraysEqualAsSet(
  a: readonly string[],
  b: readonly string[],
): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const setA = new Set(a);
  if (setA.size !== new Set(b).size) {
    return false;
  }

  return b.every((item) => setA.has(item));
}

type FieldComparator<T extends Record<string, unknown>> = (
  key: keyof T,
  current: unknown,
  original: unknown,
) => boolean;

export function hasFieldChanges<T extends Record<string, unknown>>(
  current: T,
  original: T,
  fields: readonly (keyof T)[],
  options?: { isEqual?: FieldComparator<T> },
): boolean {
  const isEqual = options?.isEqual ?? ((_, currentValue, originalValue) => isSameValue(currentValue, originalValue));
  return fields.some((field) => !isEqual(field, current[field], original[field]));
}

export function getChangedFields<T extends Record<string, unknown>>(
  current: T,
  original: T,
  fields: readonly (keyof T)[],
  options?: { isEqual?: FieldComparator<T> },
): Partial<T> {
  const isEqual = options?.isEqual ?? ((_, currentValue, originalValue) => isSameValue(currentValue, originalValue));
  const changes: Partial<T> = {};

  for (const field of fields) {
    if (!isEqual(field, current[field], original[field])) {
      changes[field] = current[field];
    }
  }

  return changes;
}
