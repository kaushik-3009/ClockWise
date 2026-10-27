import { deleteField, type FieldValue } from 'firebase/firestore';

/** Drop keys whose value is undefined (Firestore rejects them in documents). */
export function stripUndefined<T extends object>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) result[key] = value;
  }
  return result as T;
}

/**
 * Turn a partial "changes" object into an update payload: keys explicitly set to
 * undefined become deleteField(), so clearing an optional field (e.g. a project
 * description) actually removes it instead of failing.
 */
export function toUpdate<T extends object>(changes: T): Record<string, unknown | FieldValue> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(changes)) {
    result[key] = value === undefined ? deleteField() : value;
  }
  return result;
}
