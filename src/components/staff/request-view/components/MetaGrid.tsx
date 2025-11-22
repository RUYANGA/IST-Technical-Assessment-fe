import React from "react"
import type { RequestItem } from "@/components/staff/overwie/services/staffService"

function safeNum(v: unknown) {
  if (v == null || v === "") return NaN
  if (typeof v === "number") return Number.isFinite(v) ? v : NaN
  if (typeof v === "string") {
    const n = Number(String(v).replace(/,/g, "").trim())
    return Number.isFinite(n) ? n : NaN
  }
  return NaN
}

function computeAmount(r?: RequestItem | null): number | null {
  if (!r) return null

  // r.amount and r.total_amount are typed in RequestItem as number | string | undefined
  const a = safeNum(r.amount ?? r.total_amount)
  if (Number.isFinite(a)) return a

  const items = Array.isArray(r.items) ? r.items : []
  if (items.length) {
    return items.reduce((sum: number, it) => {
      // item fields are typed as number | string | undefined
      const q = safeNum(it.quantity) || 0
      const up = safeNum(it.unit_price) || 0
      return sum + q * up
    }, 0)
  }
  return null
}

function formatFrw(value?: number | null) {
  if (!Number.isFinite(value ?? NaN)) return "—"
  return `Frw ${Math.round(value!).toLocaleString()}`
}

export default function MetaGrid({ request }: { request: RequestItem }) {
  const amount = computeAmount(request)
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="space-y-1">
        <div className="text-xs text-slate-500">Amount</div>
        <div className="font-medium text-slate-800">{formatFrw(amount)}</div>
      </div>

      <div className="space-y-1">
        <div className="text-xs text-slate-500">Status</div>
        <div className="font-medium text-slate-800">{request.status ?? "PENDING"}</div>
      </div>

      <div className="space-y-1">
        <div className="text-xs text-slate-500">Created</div>
        <div className="font-medium text-slate-800">
          {request.created_at ? new Date(request.created_at).toLocaleString() : "—"}
        </div>
      </div>
    </div>
  )
}