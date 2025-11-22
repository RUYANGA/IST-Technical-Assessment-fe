export async function loadDefaults(svc: Record<string, unknown> | unknown): Promise<Record<string, unknown> | null> {
  if (svc == null || typeof svc !== "object") return null
  const s = svc as Record<string, unknown>

  // accept several possible names for a defaults getter so this works with different service shapes
  const maybeFn =
    (s.getDefaults ?? s.fetchDefaults ?? s.defaults) as unknown

  if (typeof maybeFn === "function") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (maybeFn as any)()
    } catch {
      return null
    }
  }

  return null
}