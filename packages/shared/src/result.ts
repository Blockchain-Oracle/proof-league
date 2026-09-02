// Error law (CONVENTIONS §6): fallible domain functions return Result, never throw for expected
// failures. Error unions are string literals so UI copy maps can be compile-checked complete.
export type Result<T, E extends string> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): { ok: true; value: T } => ({ ok: true, value });
export const err = <E extends string>(error: E): { ok: false; error: E } => ({ ok: false, error });

// Transaction submissions return report objects, not throws: `submitReached` decides the copy,
// because "nothing happened" must never be claimed when a transaction may have been broadcast.
export type SubmitReport<E extends string> = {
  readonly status: "accepted" | "refused" | "unknown";
  readonly submitReached: boolean;
  readonly error?: E;
  readonly txHash?: `0x${string}`;
  readonly refCode?: string;
};
