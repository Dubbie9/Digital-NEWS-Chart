/**
 * Collision-safe record IDs. `Date.now()` alone collides when two records
 * are created in the same millisecond — and, more importantly, when
 * records created independently on two ward devices are merged via
 * backup import (same-ID records are silently skipped as duplicates).
 */
export function newId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}${Date.now().toString(36)}_${random}`;
}
