"use client"
import React, { useMemo } from "react"
// ensure path matches your folder name — project uses "overwie" in many files
import useStaffOverview from "../overview/hooks/useStaffRequests"
import { Eye, Calendar, Clock, CheckCircle, Trash2 } from "lucide-react"

export default function AprovalPanding() {
  const { loading, recent, refresh } = useStaffOverview()

  const pending = useMemo(() => {
    return (recent ?? []).filter((r) => String(r.status ?? "").toUpperCase() === "PENDING")
  }, [recent])

  // item in request.items
  interface LineItem {
    quantity?: number | string | null
    unit_price?: number | string | null
    [key: string]: unknown
  }

  // row shape used by this component (subset of backend request)
  interface ApprovalRow {
    id?: number | string
    title?: string
    description?: string
    amount?: number | string | null
    total_amount?: number | string | null
    items?: LineItem[] | null
    status?: string | null
    created_at?: string | null
    [key: string]: unknown
  }

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
    const a = safeNum(r.amount ?? r.total_amount)
    if (Number.isFinite(a)) return a
    const items = Array.isArray(r.items) ? (r.items as LineItem[]) : []
    if (items.length) {
      return items.reduce((s: number, it: LineItem) => s + (safeNum(it.quantity) || 0) * (safeNum(it.unit_price) || 0), 0)
    }
    return NaN
  }

  const formatFrw = (v: number) => (!Number.isFinite(v) ? "—" : `Frw ${Math.round(v).toLocaleString()}`)

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-slate-100 rounded w-1/4" />
          <div className="h-10 bg-slate-100 rounded" />
          <div className="h-10 bg-slate-100 rounded" />
          <div className="h-10 bg-slate-100 rounded" />
        </div>
      </div>
    )
  }

  if (!pending.length) {
    return (
      <div className="p-4 text-sm text-slate-500">
        No pending requests.
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Pending Requests</h3>
        <button onClick={refresh} className="text-sm text-sky-600">Refresh</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm table-auto">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="py-2 px-3">Title</th>
              <th className="py-2 px-3 text-right">Amount</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Created</th>
              <th className="py-2 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.slice(0, 12).map((rRaw, idx) => {
              const r = rRaw as ApprovalRow
              const key = r.id != null ? String(r.id) : `pending-${idx}`
              return (
                <tr key={key} className="border-b last:border-b-0 hover:bg-slate-50">
                  <td className="py-2 px-3">
                    <div className="font-medium truncate max-w-xs">{r.title}</div>
                    {r.description && <div className="text-xs text-slate-500">{String(r.description).slice(0, 80)}</div>}
                  </td>

                  <td className="py-2 px-3 text-right font-medium">{formatFrw(computeAmount(r))}</td>

                  <td className="py-2 px-3">
                    <div className="inline-flex items-center gap-2">
                      {String(r.status ?? "").toUpperCase() === "APPROVED" && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                      {String(r.status ?? "").toUpperCase() === "PENDING" && <Clock className="w-4 h-4 text-amber-500" />}
                      {String(r.status ?? "").toUpperCase() === "REJECTED" && <Trash2 className="w-4 h-4 text-rose-500" />}
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded ${
                          String(r.status ?? "").toUpperCase() === "APPROVED"
                            ? "bg-emerald-100 text-emerald-700"
                            : String(r.status ?? "").toUpperCase() === "REJECTED"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {String(r.status ?? "PENDING")}
                      </span>
                    </div>
                  </td>

                  <td className="py-2 px-3 text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</span>
                    </div>
                  </td>

                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      title="View request"
                      aria-label="View request"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100"
                    >
                      <Eye className="w-4 h-4 text-slate-600" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}