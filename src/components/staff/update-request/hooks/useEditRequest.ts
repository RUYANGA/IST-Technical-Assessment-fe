import { useEffect, useMemo, useState } from "react"
import { createStaffService } from "@/components/staff/overwie/services/staffService"
import type { EditHookResult } from "./types"
import { useItemsManager } from "./itemsManager"
import { loadRequest, normalizeItems } from "./loadRequest"
import { loadDefaults } from "./loadDefaults"

// safe parser for numeric approval level values coming from API (handles string/number/undefined)
function toNumberOrNull(v: unknown): number | null {
  if (v == null || v === "") return null
  if (typeof v === "number") return Number.isFinite(v) ? v : null
  if (typeof v === "string") {
    const cleaned = v.replace(/,/g, "").trim()
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : null
  }
  return null
}

export default function useEditRequest(id?: string | null): EditHookResult & { loaded: boolean } {
  const svc = createStaffService()

  const [loading, setLoading] = useState<boolean>(Boolean(id))
  const [loadingDefaults, setLoadingDefaults] = useState<boolean>(true)
  const [loaded, setLoaded] = useState<boolean>(!Boolean(id)) // true when there's no id to load
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [title, setTitle] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [requiredLevels, setRequiredLevels] = useState<number | null>(null)
  const [requestStatus, setRequestStatus] = useState<string | null>(null)

  // Do not pass a fresh [] literal (causes infinite updates). Start with empty and setItems when data loads.
  const { items, setItems, addItem, updateItem, removeItem } = useItemsManager()

  useEffect(() => {
    let mounted = true
    async function run() {
      if (!id) {
        setLoading(false)
        if (mounted) setLoaded(true)
        return
      }
      setLoading(true)
      setLoadError(null)
      try {
        const resp = await loadRequest(svc, id)
        if (!mounted) return
        const r = (resp ?? {}) as Record<string, unknown>
        setTitle(String(r.title ?? ""))
        setDescription(String(r.description ?? ""))
        setRequestStatus(typeof r.status === "string" ? r.status : (r.status == null ? null : String(r.status)))
        setItems(normalizeItems(r.items as unknown[] | undefined))
        const candidate = r.required_approval_levels ?? r.required_approval_level ?? r.required_levels
        const parsed = toNumberOrNull(candidate)
        setRequiredLevels(parsed ?? null)
      } catch (err: unknown) {
        setLoadError((err as Error)?.message ?? "Failed to load request")
      } finally {
        if (mounted) {
          setLoading(false)
          setLoaded(true)
        }
      }
    }
    run()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    let mounted = true
    async function run() {
      setLoadingDefaults(true)
      try {
        const d = await loadDefaults(svc)
        if (!mounted) return
        // safely read numeric approval level from defaults response
        const defs = (d as Record<string, unknown> | null)
        const cand = defs?.required_approval_levels ?? defs?.required_level ?? requiredLevels
        const parsed = toNumberOrNull(cand)
        setRequiredLevels(parsed ?? 1)
      } catch {
        if (mounted && requiredLevels == null) setRequiredLevels(1)
      } finally {
        if (mounted) setLoadingDefaults(false)
      }
    }
    run()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalAmount = useMemo(() => {
    const n = items.reduce((sum, it) => {
      const q = typeof it.quantity === "string" ? Number(it.quantity.replace(/,/g, "")) : Number(it.quantity)
      const up = typeof it.unit_price === "string" ? Number(String(it.unit_price).replace(/,/g, "")) : Number(it.unit_price)
      const qn = Number.isFinite(q) ? q : 0
      const upn = Number.isFinite(up) ? up : 0
      return sum + qn * upn
    }, 0)
    return Number.isFinite(n) ? `Frw ${Math.round(n).toLocaleString()}` : "—"
  }, [items])

  // basic form validation (do not gate on `id` here so UI can enable once data is loaded)
  const canSubmit = useMemo(() => {
    if (submitting || loading) return false
    if (!title.trim()) return false
    if (!items.length) return false
    return true
  }, [title, items, submitting, loading])

  async function submitUpdate(): Promise<{ id?: string | number } | null> {
    if (!id) throw new Error("Missing request id")
    setSubmitting(true)
    try {
      const payload = {
        title: title ?? "",
        description: description ?? "",
        items: items.map((it) => ({
          name: it.name,
          description: it.description,
          quantity: typeof it.quantity === "string" ? Number(it.quantity) : it.quantity,
          unit_price: typeof it.unit_price === "string" ? Number(it.unit_price) : it.unit_price,
        })),
        required_approval_levels: requiredLevels ?? 1,
      }

      const svcAny = svc as Record<string, unknown>
      const candidates = [
        "updateRequest",
        "update",
        "putRequest",
        "put",
        "patchRequest",
        "patch",
      ]

      for (const name of candidates) {
        const fn = svcAny[name]
        if (typeof fn === "function") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const res = await (fn as any)(id, payload)
          return (res as { id?: string | number }) ?? null
        }
      }

      throw new Error("Update not supported by staff service")
    } finally {
      setSubmitting(false)
    }
  }

  return {
    loading,
    loadingDefaults,
    submitting,
    canSubmit,
    loaded,
    title,
    setTitle,
    description,
    setDescription,
    items,
    addItem,
    updateItem,
    removeItem,
    requiredLevels,
    setRequiredLevels,
    totalAmount,
    requestStatus,
    loadError,
    submitUpdate,
  }
}