"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import createStaffService, { RequestItem, StaffStats } from "../services/staffService"

type UseStaffOverviewReturn = {
  loading: boolean
  recent: RequestItem[]
  stats: StaffStats
  refresh: () => Promise<void>
  deleteRequest: (id: number | string) => Promise<boolean>
  updateRequest: (id: number | string, payload: Partial<RequestItem>) => Promise<RequestItem | null>
}

/**
 * Hook that encapsulates fetching logic. Single Responsibility:
 * - maintains loading / data state
 * - exposes refresh for callers
 *
 * Accepts an optional service for easier testing (Open/Closed, Dependency Inversion).
 */
export function useStaffOverview(service = createStaffService()) : UseStaffOverviewReturn {
  const [loading, setLoading] = useState<boolean>(true)
  const [recent, setRecent] = useState<RequestItem[]>([])
  const [stats, setStats] = useState<StaffStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    total_amount: 0,
  })

  // prevent duplicate runs in React Strict Mode (dev) and avoid updates after unmount
  const startedRef = useRef(false)
  const mountedRef = useRef(true)

  const load = useCallback(async () => {
    // indicate in-flight
    if (mountedRef.current) setLoading(true)

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") ?? undefined : undefined
      const [recentRes, statsRes] = await Promise.all([
        service.fetchRecent(token),
        service.fetchStats(token),
      ])

      if (!mountedRef.current) return

      setRecent(recentRes ?? [])

      if (statsRes) {
        setStats({
          total: statsRes.total ?? 0,
          pending: statsRes.pending ?? 0,
          approved: statsRes.approved ?? 0,
          rejected: statsRes.rejected ?? 0,
          total_amount: statsRes.total_amount ?? 0,
        })
      } else {
        // derive simple stats from recent data if no stats endpoint
        const items = recentRes ?? []
        const pending = items.filter(i => i.status === "PENDING").length
        const approved = items.filter(i => i.status === "APPROVED").length
        const rejected = items.filter(i => i.status === "REJECTED").length

        const safeNum = (v: unknown): number => {
          if (v == null || v === "") return 0
          if (typeof v === "number") return Number.isFinite(v) ? v : 0
          const cleaned = String(v).replace(/,/g, "").trim()
          const n = Number(cleaned)
          return Number.isFinite(n) ? n : 0
        }

        const total_amount = items.reduce((s, it: RequestItem) => {
          // support item.amount or item.total_amount
          const itemAmount = it.amount ?? it.total_amount ?? 0
          return s + safeNum(itemAmount)
        }, 0)

        setStats({
          total: items.length,
          pending,
          approved,
          rejected,
          total_amount,
        })
      }
    } catch (err) {
      console.error("useStaffOverview load failed", err)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [service])

  useEffect(() => {
    mountedRef.current = true

    if (!startedRef.current) {
      startedRef.current = true
      load()
    }

    return () => {
      mountedRef.current = false
    }
  }, [load])

  const deleteRequest = useCallback(async (id: number | string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") ?? undefined : undefined
      await service.deleteRequest(id, token)
      // optimistic update: remove from list and adjust stats
      setRecent((prev) => prev.filter((r) => r.id !== id))
      setStats((s) => ({ ...s, total: Math.max(0, s.total - 1) }))
      return true
    } catch (err) {
      console.error("deleteRequest failed", err)
      return false
    }
  }, [service])

  const updateRequest = useCallback(async (id: number | string, payload: Partial<RequestItem>) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") ?? undefined : undefined
      const updated = await service.updateRequest(id, payload, token)
      if (!updated) return null
      setRecent((prev) => prev.map((r) => (r.id === id ? updated : r)))
      // refresh stats to keep them accurate
      load()
      return updated
    } catch (err) {
      console.error("updateRequest failed", err)
      return null
    }
  }, [service, load])

  return { loading, recent, stats, refresh: load, deleteRequest, updateRequest }
}

export default useStaffOverview