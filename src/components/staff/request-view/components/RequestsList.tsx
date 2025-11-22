import React, { useState } from "react"
import Link from "next/link"
import type { RequestItem } from "@/components/staff/overwie/services/staffService"
import { Package, Calendar, MoreHorizontal, CheckCircle, Clock, Trash2 } from "lucide-react"

type Props = {
  items: RequestItem[]
  loading: boolean
  onDelete: (id: number | string) => Promise<void | boolean>
  onOpen?: (id: number | string) => void
}

export default function RequestsList({ items, loading, onDelete, onOpen }: Props) {
  const [deletingId, setDeletingId] = useState<number | string | null>(null)

  if (loading) {
    return <div className="space-y-2"><div className="h-8 bg-slate-100 rounded" /><div className="h-8 bg-slate-100 rounded" /></div>
  }
  if (!items.length) return <div className="text-sm text-slate-500">No requests yet.</div>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm table-auto">
        <thead>
          <tr className="text-left text-slate-500 border-b">
            <th className="py-3 px-4 min-w-[38%]">Title</th>
            <th className="py-3 px-4 w-36 text-right">Amount</th>
            <th className="py-3 px-4 w-28">Status</th>
            <th className="py-3 px-4 w-36">Created</th>
            <th className="py-3 px-4 w-24 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id} className="border-b last:border-b-0 hover:bg-slate-50">
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
                        {String(r.description).length > 80
                          ? String(r.description).slice(0, 80) + "…"
                          : String(r.description)}
                      </span>
                    </div>
                  )}
                </div>
              </td>

              <td className="py-3 px-4 text-right font-medium text-slate-800">
                {(() => {
                  const safeNum = (v: unknown) => {
                    if (v == null || v === "") return NaN
                    if (typeof v === "number") return Number.isFinite(v) ? v : NaN
                    if (typeof v === "string") {
                      const n = Number(String(v).replace(/,/g, "").trim())
                      return Number.isFinite(n) ? n : NaN
                    }
                    return NaN
                  }
                  const a = safeNum((r as unknown as Record<string, unknown>).amount ?? (r as unknown as Record<string, unknown>).total_amount)
                  let amt: number | null = null
                  if (Number.isFinite(a)) amt = a
                  else if (Array.isArray(r.items) && r.items.length) {
                    amt = r.items.reduce((s, it) => {
                      const q = safeNum((it as unknown as Record<string, unknown>).quantity) || 0
                      const up = safeNum((it as unknown as Record<string, unknown>).unit_price) || 0
                      return s + q * up
                    }, 0)
                  }
                  if (!Number.isFinite(amt ?? NaN)) return "—"
                  return `Frw ${Math.round(amt!).toLocaleString()}`
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

              <td className="py-3 px-4 text-center">
                <div className="inline-flex items-center justify-center">
                  <Link
                    href={`/dashboards/staff/requests/${r.id}`}
                    className="inline-flex items-center px-2 py-1 rounded hover:bg-slate-50 text-slate-600"
                    onClick={() => onOpen?.(r.id)}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={async () => {
                      if (!confirm("Delete this request? This action cannot be undone.")) return
                      setDeletingId(r.id)
                      try {
                        await onDelete(r.id)
                      } finally {
                        setDeletingId(null)
                      }
                    }}
                    disabled={deletingId === r.id}
                    className="ml-2 inline-flex items-center px-2 py-1 rounded text-rose-600 hover:bg-slate-50 disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}