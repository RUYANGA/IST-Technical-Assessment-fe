"use client"
import { useCallback, useEffect, useState } from "react"
import createStaffService, { RequestItem, StaffStats } from "../services/staffService"

const svc = createStaffService()

export default function useStaffOverview() {
  const [loading, setLoading] = useState<boolean>(true)
  const [recent, setRecent] = useState<RequestItem[]>([])
  const [mine, setMine] = useState<RequestItem[]>([])
  const [stats, setStats] = useState<StaffStats>({ total: 0, pending: 0, approved: 0, rejected: 0, total_amount: 0 })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pending, s, approvals] = await Promise.all([
        svc.fetchPending(),
        svc.fetchStats(),
        svc.fetchRecent(),
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
    stats,
    refresh: load,
  }
}