"use client"
import React, { useRef, useMemo, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import createStaffService from "./services/staffService"
import type { RequestItem, ApprovalEntry, StaffStats } from "./services/staffService"
import {
  Eye,
  Trash2,
  DollarSign,
  Layers,
  Calendar,
  RefreshCw,
  List,
  CheckCircle,
  Clock,
  Package,
  XCircle, // added icon for rejected
} from "lucide-react"

export default function ApprovalOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [recent, setRecent] = useState<RequestItem[]>([])
  const [mine, setMine] = useState<RequestItem[]>([])
  const [rejectedMine, setRejectedMine] = useState<ApprovalEntry[]>([])
  const [stats, setStats] = useState<StaffStats | null>(null)
  // memoize service so it doesn't recreate every render (helps with hook deps)
  const svc = useMemo(() => createStaffService(), [])

  const searchParams = useSearchParams()

  // track mounted state so load() can avoid setting state on unmounted component
  const mountedRef = useRef(true)

  // load data (approvals/mine, pending, stats, rejected)
  const load = useCallback(async () => {
    mountedRef.current = true
    setLoading(true)
    try {
      const pending = await svc.fetchPending()
      const recentApprovals = await svc.fetchRecent()
      const mineList: RequestItem[] = []

      const normalize = (p: unknown): RequestItem | null => {
        if (!p || typeof p !== "object") return null
        const src = (p as Record<string, unknown>).purchase_request ?? (p as Record<string, unknown>).request ?? p
        if (!src || typeof src !== "object") return null
        const s = src as Record<string, unknown>
        const get = (k: string) => (s[k] === undefined ? undefined : s[k])

        const id = get("id") ?? get("request_id") ?? get("purchase_request_id")
        if (id == null) return null

        const statusRaw = get("status") ?? get("purchase_request_status") ?? ""
        const status = String(statusRaw ?? "").toUpperCase() as RequestItem["status"] | undefined

        return {
          id: id as number | string,
          title: (get("title") ?? get("name")) as string | undefined,
          description: (get("description") ?? get("details")) as string | undefined,
          amount: (get("amount") ?? get("total_amount")) as number | string | undefined,
          total_amount: get("total_amount") as number | string | undefined,
          status: status || undefined,
          created_at: (get("created_at") ?? get("createdAt") ?? get("created")) as string | undefined,
          items: Array.isArray(s.items) ? (s.items as RequestItem["items"]) : [],
          current_approval_level: typeof get("current_approval_level") === "number" ? (get("current_approval_level") as number) : Number(get("current_approval_level") ?? get("current_level") ?? NaN) || undefined,
          required_approval_levels: typeof get("required_approval_levels") === "number" ? (get("required_approval_levels") as number) : Number(get("required_approval_levels") ?? get("required_approval_level") ?? NaN) || undefined,
          _raw: s,
        } as RequestItem & { _raw?: unknown }
      }

      if (Array.isArray(recentApprovals)) {
        for (const e of recentApprovals as ApprovalEntry[]) {
          const entry = (e.purchase_request ?? e.request ?? e) as unknown
          const n = normalize(entry)
          if (n) mineList.push(n)
        }
      } else if (recentApprovals && typeof recentApprovals === "object") {
        const obj = recentApprovals as Record<string, unknown>
        const candidates = ["approved_requests", "pending_requests", "approvals", "results", "data"]
        for (const k of candidates) {
          const val = obj[k]
          if (Array.isArray(val)) {
            for (const entry of val as ApprovalEntry[]) {
              const n = normalize(entry)
              if (n) mineList.push(n)
            }
          }
        }
      }

      const rejected = await svc.fetchMineRejectedEntries()
      const s = await svc.fetchStats()

      if (!mountedRef.current) return
      setRecent(pending)
      setMine(mineList)
      setRejectedMine(rejected)
      setStats(s)
    } catch (err) {
      console.error(err)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [svc])

  // expose refresh used by the Refresh button
  const refresh = useCallback(() => {
    void load()
  }, [load])

  useEffect(() => {
    // initial load
    void load()
    return () => {
      mountedRef.current = false
    }
  }, [load])

  // If we were redirected back to this page with ?justApproved=<id>, fetch that request
  // and ensure it appears in `mine` so the approver sees what they just approved.
  useEffect(() => {
    const justApproved = searchParams?.get?.("justApproved")
    if (!justApproved) return
    let cancelled = false

    ;(async () => {
      try {
        const req = await svc.fetchRequest(justApproved)
        if (!req || cancelled) return
        setMine((prev) => {
          if (prev.some((p) => String(p.id) === String(req.id))) return prev
          return [req, ...prev]
        })

        // remove query param so it doesn't re-run
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href)
          url.searchParams.delete("justApproved")
          window.history.replaceState({}, "", url.toString())
        }
      } catch (err) {
        console.error("failed to fetch justApproved request", err)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [searchParams, svc])

  const tableRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()

  // safe helper to treat unknown values as object records
  const toRecord = (v: unknown): Record<string, unknown> =>
    typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {}

  // counts derived from fetched lists
  const myApprovedCount = useMemo(() => {
    return Array.isArray(mine) ? mine.filter((x) => String(x?.status ?? "").toUpperCase() === "APPROVED").length : 0
  }, [mine])

  console.log(mine)

  const myRejectedCount = useMemo(() => {
    return Array.isArray(rejectedMine) ? rejectedMine.length : 0
  }, [rejectedMine])

  // approvals/rejections by current approver
  const mineApproved = useMemo(() => {
    return Array.isArray(mine) ? mine.filter((x) => String(x?.status ?? "").toUpperCase() === "APPROVED") : []
  }, [mine])

  const mineRejected = useMemo(() => {
    // prefer explicit rejectedMine entries if present, otherwise derive from `mine`
    if (Array.isArray(rejectedMine) && rejectedMine.length) return rejectedMine
    return Array.isArray(mine) ? mine.filter((x) => String(x?.status ?? "").toUpperCase() === "REJECTED") : []
  }, [mine, rejectedMine])

  // total requests = pending (for approver) + my approved + my rejected
  const totalRequests = useMemo(() => {
    const pending = Array.isArray(recent)
      ? recent.filter((r) => {
          const rec = toRecord(r)
          const raw = toRecord(rec["_raw"])
          const s =
            rec["status"] ??
            raw["status"] ??
            raw["purchase_request_status"] ??
            (toRecord(rec["purchase_request"])["status"] ?? toRecord(raw["purchase_request"])["status"]) ??
            ""
          return String(s ?? "").toUpperCase() === "PENDING"
        }).length
      : 0
    return pending + myApprovedCount + myRejectedCount
  }, [recent, myApprovedCount, myRejectedCount])

  function handleViewRequest(r: RequestItem | unknown) {
    const rec = (r ?? {}) as Record<string, unknown>
    const id = rec["id"] ?? rec["request_id"] ?? rec["purchase_request_id"]
    if (!id) return
    // navigate to request details page
    router.push(`/dashboards/approval/${String(id)}`)
  }

  // only show pending requests in the table
  const pendingList = useMemo(() => {
    const toRecord = (v: unknown): Record<string, unknown> =>
      typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {}

    const getStatus = (r: RequestItem | unknown) => {
      const rec = toRecord(r ?? {})
      const raw = toRecord(rec["_raw"])

      const purchaseReqFromRaw = raw["purchase_request"]
        ? toRecord(raw["purchase_request"])["status"]
        : undefined

      const purchaseReqFromRec = rec["purchase_request"]
        ? toRecord(rec["purchase_request"])["status"]
        : undefined

      const val =
        rec["status"] ??
        raw["status"] ??
        raw["purchase_request_status"] ??
        purchaseReqFromRaw ??
        rec["purchase_request_status"] ??
        purchaseReqFromRec ??
        ""

      return String(val ?? "").toUpperCase()
    }

    return (recent ?? []).filter((r) => getStatus(r) === "PENDING")
  }, [recent])

  // compute a numeric amount from several possible API shapes:
  // - r.amount (number|string)
  // - r.total_amount (number|string)
  // - r.items -> sum(quantity * unit_price)
  function computeAmount(r: RequestItem | unknown): number {
    const rec = (r ?? {}) as Record<string, unknown>

    const safeNum = (v: unknown): number => {
      if (v == null || v === "") return NaN
      if (typeof v === "number") return Number.isFinite(v) ? v : NaN
      if (typeof v === "string") {
        const cleaned = v.replace(/,/g, "").trim()
        const n = Number(cleaned)
        return Number.isFinite(n) ? n : NaN
      }
      return NaN
    }

    // prefer explicit amount / total_amount
    const a = safeNum(rec.amount ?? rec.total_amount)
    if (Number.isFinite(a)) return a

    // fallback to items array
    const items = Array.isArray(rec.items) ? (rec.items as Array<Record<string, unknown>>) : []
    if (items.length) {
      return items.reduce((sum: number, it) => {
        const q = safeNum(it.quantity) || 0
        const up = safeNum(it.unit_price) || 0
        return sum + q * up
      }, 0)
    }

    return NaN
  }

  // total spent (only APPROVED requests) — prefer mine (approvals/mine)
  const approvedTotal = useMemo(() => {
    const list = Array.isArray(mine) && mine.length ? mine : recent
    return (list ?? []).reduce((sum, r) => {
      const amt = computeAmount(r)
      return sum + (String(r?.status ?? "").toUpperCase() === "APPROVED" && Number.isFinite(amt) ? amt : 0)
    }, 0)
  }, [mine, recent])

  function formatFrw(value: number) {
    if (!Number.isFinite(value)) return "—"
    // Rwandan franc typically shown without decimals
    return `Frw ${Math.round(value).toLocaleString()}`
  }

  // compact FRW: 1_000 -> Frw 1K, 1_000_000 -> Frw 1M
  function formatFrwCompact(value: number) {
    if (!Number.isFinite(value)) return "—"
    const abs = Math.abs(Math.round(value))
    if (abs >= 1_000_000) return `Frw ${Math.round(value / 1_000_000)}M`
    if (abs >= 1_000) return `Frw ${Math.round(value / 1_000)}K`
    return `Frw ${Math.round(value).toLocaleString()}`
  }

  // compact number for totals: 1000 -> 1K, 1000000 -> 1M
  function formatCompactNumber(v: number | null | undefined) {
    const n = Number(v ?? 0)
    if (!Number.isFinite(n) || n === 0) return String(n === 0 ? "0" : "—")
    if (Math.abs(n) >= 1_000_000) return `${Math.round(n / 1_000_000)}M`
    if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)}K`
    return String(n)
  }

  // show current and required approval levels (supports a few possible backend field names)
  function formatApprovalLevels(r: RequestItem | unknown): string {
    const rec = (r ?? {}) as Record<string, unknown>
    const toNum = (v: unknown): number | null => {
      if (v == null || v === "") return null
      if (typeof v === "number") return Number.isFinite(v) ? v : null
      if (typeof v === "string") {
        const n = Number(String(v).replace(/,/g, "").trim())
        return Number.isFinite(n) ? n : null
      }
      return null
    }

    const cur = toNum(rec.current_approval_level ?? rec.current_level) ?? null
    const req = toNum(rec.required_approval_levels ?? rec.required_approval_level ?? rec.required_levels) ?? null

    if (cur == null && req == null) return "—"
    if (req == null) return `Level ${cur ?? 0}`
    return `${cur ?? 0} / ${req}`
  }

  // show full-page skeleton while overview is loading
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-100 rounded w-1/3" />

          <section className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div className="h-28 p-6 bg-slate-100 rounded-lg" />
            <div className="h-28 p-6 bg-slate-100 rounded-lg" />
            <div className="h-28 p-6 bg-slate-100 rounded-lg" />
            <div className="h-28 p-6 bg-slate-100 rounded-lg" />
          </section>

          <section className="bg-white rounded shadow-sm p-4">
            <div className="space-y-2">
              <div className="h-6 bg-slate-100 rounded w-1/4" />
              <div className="h-8 bg-slate-100 rounded" />
              <div className="h-8 bg-slate-100 rounded" />
              <div className="h-8 bg-slate-100 rounded" />
            </div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-3">Approver Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Create and track your purchase requests.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboards/staff/requests" className="inline-flex items-center px-4 py-2 border rounded text-sm gap-2 hover:bg-slate-50">
            <List className="w-4 h-4 text-slate-600" /> My Approval
          </Link>

          <button onClick={refresh} className="inline-flex items-center px-3 py-2 border rounded text-sm gap-2 hover:bg-slate-50" title="Refresh">
            <RefreshCw className="w-4 h-4 text-slate-600" /> Refresh
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-5 gap-6"> {/* changed to 5 cols */}
        <div className="p-6 md:p-8 bg-white rounded-lg shadow-md flex items-center gap-4">
          <div className="p-3 md:p-4 rounded-lg bg-slate-100">
            <List className="w-8 h-8 md:w-10 md:h-10 text-slate-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm md:text-base text-slate-500">Total Requests</div>
            <div className="text-2xl md:text-3xl font-semibold">
              {loading ? "—" : formatCompactNumber(Number(totalRequests))}
            </div>
          
          </div>
        </div>

        <div className="p-6 md:p-8 bg-white rounded-lg shadow-md flex items-center gap-4">
          <div className="p-3 md:p-4 rounded-lg bg-amber-50">
            <Clock className="w-8 h-8 md:w-10 md:h-10 text-amber-500" />
          </div>
          <div className="flex-1">
            <div className="text-sm md:text-base text-slate-500">Pending</div>
            <div className="text-2xl md:text-3xl font-semibold text-amber-600">
              {loading ? "—" : String(recent?.length)}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 bg-white rounded-lg shadow-md flex items-center gap-4">
          <div className="p-3 md:p-4 rounded-lg bg-emerald-50">
            <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-emerald-500" />
          </div>
          <div className="flex-1">
            <div className="text-sm md:text-base text-slate-500">My Approved</div>
            <div className="text-2xl md:text-3xl font-semibold text-emerald-600">
              {loading ? "—" : String(myApprovedCount)}
            </div>
        
          </div>
        </div>

        <div className="p-6 md:p-8 bg-white rounded-lg shadow-md flex items-center gap-4">
          <div className="p-3 md:p-4 rounded-lg bg-rose-50">
            <XCircle className="w-8 h-8 md:w-10 md:h-10 text-rose-500" />
          </div>
          <div className="flex-1">
            <div className="text-sm md:text-base text-slate-500">My Rejected</div>
            <div className="text-2xl md:text-3xl font-semibold text-rose-600">
              {loading
                ? "—"
                : String(
                    Array.isArray(rejectedMine)
                      ? rejectedMine.length
                      : Array.isArray(mine)
                      ? mine.filter((x) => String(x?.status ?? "").toUpperCase() === "REJECTED").length
                      : stats?.rejected ?? 0
                  )}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 bg-white rounded-lg shadow-md flex items-center gap-4">
          <div className="p-3 md:p-4 rounded-lg bg-slate-50">
            <DollarSign className="w-8 h-8 md:w-10 md:h-10 text-slate-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm md:text-base text-slate-500">Approved</div>
            <div className="text-2xl md:text-2xl font-semibold">{loading ? "—" : formatFrwCompact(approvedTotal)}</div>
          </div>
        </div>
        
      </section>

      {/* My approvals / rejections preview */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Approved by me</h3>
            <div className="text-xs text-slate-500">{mineApproved.length}</div>
          </div>

          {mineApproved.length === 0 ? (
            <div className="text-sm text-slate-500">No approvals yet.</div>
          ) : (
            <ul className="space-y-2">
              {mineApproved.slice(0, 6).map((r) => (
                <li key={String(r.id)} className="flex items-center justify-between text-sm">
                  <button onClick={() => router.push(`/dashboards/approval/${String(r.id)}`)} className="text-left truncate text-slate-700">
                    {r.title ?? `Request ${r.id}`}
                  </button>
                  <div className="text-slate-500 ml-3">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Rejected by me</h3>
            <div className="text-xs text-slate-500">{mineRejected.length}</div>
          </div>

          {mineRejected.length === 0 ? (
            <div className="text-sm text-slate-500">No rejections yet.</div>
          ) : (
            <ul className="space-y-2">
              {mineRejected.slice(0, 6).map((r) => {
                const rec = (r as unknown) as RequestItem
                return (
                  <li key={String(rec.id ?? (r as any).id)} className="flex items-center justify-between text-sm">
                    <button onClick={() => router.push(`/dashboards/approval/${String(rec.id ?? (r as any).id)}`)} className="text-left truncate text-slate-700">
                      {rec.title ?? `Request ${rec.id ?? (r as any).id}`}
                    </button>
                    <div className="text-slate-500 ml-3">{rec.created_at ? new Date(rec.created_at).toLocaleDateString() : "—"}</div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="bg-white rounded shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-600" /> Recent Requests
          </h2>

          <div className="flex items-center gap-2">
            <Link href="/dashboards/approval/pending" className="text-sm text-sky-600 flex items-center gap-1">
              <Eye className="w-4 h-4" /> View all
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-8 bg-slate-100 rounded" />
            <div className="h-8 bg-slate-100 rounded" />
            <div className="h-8 bg-slate-100 rounded" />
          </div>
        ) : pendingList.length === 0 ? (
          <div className="text-sm text-slate-500">No pending approvals.</div>
        ) : (
          <div ref={tableRef} className="overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-3 px-4 min-w-[38%]">Title</th>
                  <th className="py-3 px-4 w-36 text-right">Amount <DollarSign className="inline-block w-4 h-4 ml-1 text-slate-400" /></th>
                  <th className="py-3 px-4 w-28">Status</th>
                  <th className="py-3 px-4 w-36">Created <Calendar className="inline-block w-4 h-4 ml-1 text-slate-400" /></th>
                  <th className="py-3 px-4 w-28">Approval <Layers className="inline-block w-4 h-4 ml-1 text-slate-400" /></th>
                  <th className="py-3 px-4 w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingList.slice(0, 12).map((r) => (
                  <tr key={r.id} className="border-b last:border-b-0 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 flex items-start gap-3 min-w-0">
                      <div className="shrink-0 rounded-full bg-slate-100 w-9 h-9 flex items-center justify-center">
                        <Package className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-800 truncate">{r.title}</div>
                        {r.description && (
                          <div className="text-xs text-slate-500 mt-1">
                            <span
                              title={String(r.description)}
                              className="block max-w-full overflow-hidden whitespace-nowrap text-ellipsis"
                            >
                              {String(r.description).length > 80 ? String(r.description).slice(0, 80) + "…" : String(r.description)}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-medium text-slate-800">
                      {(() => {
                        const amt = computeAmount(r)
                        return Number.isFinite(amt) ? formatFrw(amt) : "—"
                      })()}
                    </td>

                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-2">
                        {r.status === "APPROVED" && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                        {r.status === "PENDING" && <Clock className="w-4 h-4 text-amber-500" />}
                        {r.status === "REJECTED" && <Trash2 className="w-4 h-4 text-rose-500" />}
                        <span className={`inline-block px-2 py-1 text-xs rounded ${r.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : r.status === "REJECTED" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                          {r.status ?? "PENDING"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Layers className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">{formatApprovalLevels(r)}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center align-top overflow-visible">
                      <div className="inline-block text-left">
                        <button aria-haspopup="true" onClick={() => handleViewRequest(r)} className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 focus:outline-none" title="Actions">
                          <Eye className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}