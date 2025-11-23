"use client"
import { useCallback, useEffect, useState } from "react"
import createStaffService, { RequestItem, StaffStats} from "../services/staffService"

const svc = createStaffService()

export default function useStaffOverview() {
  const [loading, setLoading] = useState<boolean>(true)
  const [recent, setRecent] = useState<RequestItem[]>([])
  const [mine, setMine] = useState<RequestItem[]>([])
  const [rejectedMine, setRejectedMine] = useState<RequestItem[]>([])
  const [stats, setStats] = useState<StaffStats>({ total: 0, pending: 0, approved: 0, rejected: 0, total_amount: 0 })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pending, s, approvals, rejectedEntries] = await Promise.all([
        svc.fetchPending(),
        svc.fetchStats(),
        svc.fetchRecent(),
        svc.fetchMineRejectedEntries?.(),
      ])

      setRecent(Array.isArray(pending) ? pending : [])
      if (s) setStats(s)

      // normalize approvals response without using `any`
      const normalizedMine: RequestItem[] = (() => {
        // direct array response
        if (Array.isArray(approvals)) return approvals as RequestItem[]

        // object response — try common keys that may contain the array
        if (approvals && typeof approvals === "object") {
          const obj = approvals as Record<string, unknown>
          const possibleKeys = ["approved_requests", "approvedRequests", "data", "results"]

          for (const k of possibleKeys) {
            const val = obj[k]
            if (Array.isArray(val)) {
              return val.map((entry) => {
                // prefer nested purchase_request/request shape if present
                if (entry && typeof entry === "object") {
                  const rec = entry as Record<string, unknown>
                  return (rec.purchase_request ?? rec.request ?? rec) as RequestItem
                }
                return entry as RequestItem
              }) as RequestItem[]
            }
          }
        }

        // fallback empty
        return []
      })()

      setMine(Array.isArray(normalizedMine) ? normalizedMine : [])

      // normalize rejected entries (ApprovalEntry[] -> RequestItem[])
      const normalizedRejected: RequestItem[] = (() => {
        if (!Array.isArray(rejectedEntries)) return []

        const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null

        return rejectedEntries.map((entry) => {
          const e = isObject(entry) ? entry : {}
          const src = (isObject(e.purchase_request) ? e.purchase_request : isObject(e.request) ? e.request : e) as Record<string, unknown>

          const get = (k: string) => {
            const v = src[k]
            return v === undefined ? undefined : v
          }

          const statusRaw = get("status") ?? get("purchase_request_status") ?? e.decision
          const status = String(statusRaw ?? "").toUpperCase()

          const created_at = get("created_at") ?? get("createdAt") ?? get("created")
          const currentLevel = get("current_approval_level") ?? get("current_level")
          const requiredLevels = get("required_approval_levels") ?? get("required_approval_level")

          return {
            id: (get("id") ?? get("request_id") ?? get("purchase_request_id")) as number | string,
            title: (get("title") ?? get("name")) as string | undefined,
            description: (get("description") ?? get("details")) as string | undefined,
            amount: (get("amount") ?? get("total_amount")) as number | string | undefined,
            total_amount: get("total_amount") as number | string | undefined,
            status: (status || undefined) as RequestItem["status"],
            created_at: (created_at as string) ?? undefined,
            items: Array.isArray(src.items) ? (src.items as RequestItem["items"]) : [],
            approved_by: get("approved_by") ?? get("approved_by_user"),
            approvals: Array.isArray(src.approvals) ? (src.approvals as unknown as RequestItem["approvals"]) : undefined,
            approved_by_user: (get("approved_by_user") as unknown as RequestItem["approved_by_user"]) ?? null,
            current_approval_level: (typeof currentLevel === "number" ? currentLevel : Number(currentLevel ?? NaN)) as number | undefined,
            required_approval_levels: (typeof requiredLevels === "number" ? requiredLevels : Number(requiredLevels ?? NaN)) as number | undefined,
            _raw: entry,
          } as RequestItem & { _raw?: unknown }
        })
      })()

      setRejectedMine(Array.isArray(normalizedRejected) ? normalizedRejected : [])
    } catch (err) {
        console.error("useStaffOverview load error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return {
    loading,
    recent,
    mine,
    rejectedMine,
    stats,
    refresh: load,
  }
}