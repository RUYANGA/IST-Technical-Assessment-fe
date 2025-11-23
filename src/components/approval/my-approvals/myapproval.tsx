"use client"
import React, { useEffect, useMemo, useState, useRef } from "react"
import api from "../../../lib/api"
import { Eye, Calendar, CheckCircle, DollarSign } from "lucide-react"
import toast, { Toaster } from "react-hot-toast"

interface LineItem {
  name?: string
  description?: string
  quantity?: number | string | null
  unit_price?: number | string | null
  [key: string]: unknown
}

interface PurchaseRequest {
  id?: number | string
  title?: string
  description?: string
  total_amount?: number | string | null
  status?: string | null
  items?: LineItem[] | null
  created_at?: string | null
  [key: string]: unknown
}

interface ApiApprovalItem {
  approval_id?: number | string
  purchase_request_id?: number | string
  title?: string
  level?: number
  approved_at?: string | null
  purchase_request_status?: string | null
  purchase_request?: PurchaseRequest | null
  [key: string]: unknown
}

interface ApprovalRow {
  // normalized shape used by the component
  id?: number | string
  approval_id?: number | string
  title?: string
  description?: string
  amount?: number | string | null
  total_amount?: number | string | null
  items?: LineItem[] | null
  status?: string | null
  created_at?: string | null
  approved_at?: string | null
  raw?: ApiApprovalItem | Record<string, unknown>
  [key: string]: unknown
}

export default function Myapproval() {
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [approvals, setApprovals] = useState<ApprovalRow[]>([])
  const prevLoading = useRef<boolean>(true)

  useEffect(() => {
    const ac = new AbortController()

    api
      .get("/approvals/mine/", { signal: ac.signal })
      .then((res) => {
        const data = res.data as unknown

        // handle different response shapes:
        let rawList: ApiApprovalItem[] = []
        if (Array.isArray(data)) rawList = data as ApiApprovalItem[]
        else if (data && typeof data === "object") {
          const obj = data as Record<string, unknown>
          if (Array.isArray(obj.results)) rawList = obj.results as ApiApprovalItem[]
          else if (Array.isArray(obj.approved_requests)) rawList = obj.approved_requests as ApiApprovalItem[]
        }

        // keep only items that you approved AND whose purchase_request status is APPROVED
        const approvedByMe = rawList.filter((a) => {
          if (!a.approved_at) return false
          const status = String(a.purchase_request_status ?? a.purchase_request?.status ?? "").toUpperCase()
          return status === "APPROVED"
        })

        // normalize only the items you approved
        const normalized: ApprovalRow[] = approvedByMe.map((a) => {
          const pr = a.purchase_request ?? ({} as PurchaseRequest)
          return {
            id: pr.id ?? a.purchase_request_id ?? a.approval_id,
            approval_id: a.approval_id,
            title: pr.title ?? a.title,
            description: pr.description ?? a.title,
            amount: pr.total_amount ?? undefined,
            total_amount: pr.total_amount ?? undefined,
            items: pr.items ?? [],
            status: pr.status ?? a.purchase_request_status ?? undefined,
            created_at: pr.created_at ?? undefined,
            approved_at: a.approved_at ?? undefined,
            raw: a as Record<string, unknown>,
          }
        })

        setApprovals(normalized)
      })
      .catch((err) => {
        if (!ac.signal.aborted) {
          const msg = err?.response?.data ? JSON.stringify(err.response.data) : err.message ?? String(err)
          setError(msg)
        }
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false)
      })

    return () => ac.abort()
  }, [])

  // show toast on error / successful load (only once per load cycle)
  useEffect(() => {
    if (prevLoading.current && !loading) {
      if (error) {
        toast.error(error)
      } else {
        toast.success(`${approvals.length} approvals loaded`)
      }
    }
    prevLoading.current = loading
  }, [loading, error, approvals.length])

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

  const computeAmount = (r: ApprovalRow): number => {
    // prefer total_amount, then amount, then items
    const a = safeNum(r.total_amount ?? r.amount)
    if (Number.isFinite(a)) return a
    const items = Array.isArray(r.items) ? (r.items as LineItem[]) : []
    if (items.length) {
      return items.reduce((s: number, it: LineItem) => {
        const q = safeNum(it.quantity)
        const up = safeNum(it.unit_price)
        return s + (Number.isFinite(q) ? q : 0) * (Number.isFinite(up) ? up : 0)
      }, 0)
    }
    return NaN
  }

  const formatFrw = (v: number) => (!Number.isFinite(v) ? "—" : `Frw ${Math.round(v).toLocaleString()}`)

  const visible = useMemo(() => approvals, [approvals])

  // render a small status badge
  const renderStatus = (r: ApprovalRow) => {
    const rawStatus = String(r.status ?? (r.raw as ApiApprovalItem)?.purchase_request_status ?? "").toUpperCase()
    const label = rawStatus || "—"
    const base = "inline-block text-xs px-2 py-0.5 rounded-full font-medium"
    if (rawStatus === "APPROVED") return <span className={`${base} bg-emerald-100 text-emerald-800`}>Approved</span>
    if (rawStatus === "PENDING") return <span className={`${base} bg-slate-100 text-slate-800`}>Pending</span>
    if (rawStatus === "REJECTED") return <span className={`${base} bg-rose-100 text-rose-800`}>Rejected</span>
    return <span className={`${base} bg-slate-100 text-slate-700`}>{label}</span>
  }

  // show a full-page loading skeleton while fetching
  if (loading) {
    return (
      <div className="w-full p-4">
        <Toaster position="top-right" />
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-100 rounded w-1/3" />

          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-20 bg-slate-100 rounded-lg" />
            <div className="h-20 bg-slate-100 rounded-lg" />
            <div className="h-20 bg-slate-100 rounded-lg" />
          </section>

          <div className="bg-white rounded shadow-sm p-4">
            <div className="h-8 bg-slate-100 rounded w-1/4 mb-3" />
            <div className="space-y-2">
              <div className="h-8 bg-slate-100 rounded" />
              <div className="h-8 bg-slate-100 rounded" />
              <div className="h-8 bg-slate-100 rounded" />
              <div className="h-8 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) return <div className="p-4 text-sm text-rose-600">Error: {error}</div>
  if (!visible.length) return <div className="p-4 text-sm text-slate-500">No approvals found.</div>

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" /> My Approved
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm table-auto">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="py-2 px-3">Title</th>
              <th className="py-2 px-3 text-right">Amount <DollarSign className="inline-block w-3 h-3 ml-1 text-slate-400" /></th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Approved at</th>
              <th className="py-2 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, idx) => (
              <tr key={r.id != null ? String(r.id) : `mine-${idx}`} className="border-b last:border-b-0 hover:bg-slate-50">
                <td className="py-2 px-3">
                  <div className="font-medium truncate max-w-xs">{r.title}</div>
                  {r.description && <div className="text-xs text-slate-500">{String(r.description).slice(0, 100)}</div>}
                </td>

                <td className="py-2 px-3 text-right font-medium">{formatFrw(computeAmount(r))}</td>

                <td className="py-2 px-3">
                  {renderStatus(r)}
                </td>

                <td className="py-2 px-3 text-slate-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{r.approved_at ? new Date(r.approved_at).toLocaleString() : (r.created_at ? new Date(r.created_at).toLocaleDateString() : "—")}</span>
                  </div>
                </td>

                <td className="py-2 px-3 text-center">
                  <button
                    type="button"
                    title="View request"
                    aria-label={`View request ${r.title ?? ""}`}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100"
                  >
                    <Eye className="w-4 h-4 text-slate-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}