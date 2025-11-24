"use client"
import React, { useEffect, useMemo, useState } from "react"
import { createStaffService } from "@/components/staff/overwie/services/staffService"
import useRequestDetails from "@/components/staff/request-view/hooks/useRequestDetails"
import MetaGrid from "@/components/staff/request-view/components/MetaGrid"
import RequestHeader from "@/components/finance/view-request/single/RequestHeader"
import type { RequestItem } from "@/components/staff/overwie/services/staffService"

function safeNum(v: unknown): number {
  if (v == null || v === "") return NaN
  if (typeof v === "number") return Number.isFinite(v) ? v : NaN
  if (typeof v === "string") {
    const n = Number(String(v).replace(/,/g, "").trim())
    return Number.isFinite(n) ? n : NaN
  }
  return NaN
}

function formatFrw(v: unknown) {
  const n = safeNum(v)
  if (!Number.isFinite(n)) return "—"
  return `Frw ${Math.round(n).toLocaleString()}`
}


export default function SingleRequestFinance({
  id: propId,
  service,
}: {
  id?: string | null
  service?: ReturnType<typeof createStaffService>
}) {
  const svc = useMemo(() => service ?? createStaffService(), [service])

  // start with propId when provided, otherwise null until effect runs on client
  const [id, setId] = useState<string | null>(() => (propId ?? null))

  useEffect(() => {
    // schedule id updates asynchronously to avoid synchronous setState inside effect
    if (typeof window === "undefined") return

    let mounted = true
    const deriveId = (): string | null => {
      if (propId) return propId
      const parts = window.location.pathname.split("/").filter(Boolean)
      const last = parts[parts.length - 1] ?? null
      if (last && !isNaN(Number(last))) return last
      return new URLSearchParams(window.location.search).get("id")
    }

    const candidate = deriveId()
    const timer = window.setTimeout(() => {
      if (!mounted) return
      setId(candidate ?? null)
    }, 0)

    return () => {
      mounted = false
      window.clearTimeout(timer)
    }
  }, [propId])

  const { request, loading, error } = useRequestDetails(id, svc)

  // provide a typed object for MetaGrid so required fields (like id) stay present
  const requestForMeta = useMemo<RequestItem | undefined>(() => {
    if (!request) return undefined
    return ({ ...(request as RequestItem), status: request.status } as RequestItem)
  }, [request])

  // show full-page skeleton while fetching
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-100 rounded w-1/3" />
          <div className="bg-white border rounded shadow-sm p-6 space-y-4">
            <div className="h-6 bg-slate-100 rounded w-2/3" />
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-36 bg-slate-100 rounded" />
            <div className="flex gap-3">
              <div className="h-4 bg-slate-100 rounded w-24" />
              <div className="h-4 bg-slate-100 rounded w-24" />
              <div className="h-4 bg-slate-100 rounded w-24" />
            </div>
            <div className="h-8 bg-slate-100 rounded w-40 mt-2" />
          </div>
        </div>
      </div>
    )
  }

  // compute items and totals (works with string/number shapes)
  const items = Array.isArray(request?.items) ? (request.items as unknown[]).map((it) => {
    const r = it && typeof it === "object" ? (it as Record<string, unknown>) : {}
    return {
      name: String(r["name"] ?? "Item"),
      quantity: safeNum(r["quantity"]),
      unit_price: safeNum(r["unit_price"]),
    }
  }) : []

  const computedTotal = items.reduce((s, it) => {
    const q = Number.isFinite(it.quantity) ? it.quantity : 0
    const up = Number.isFinite(it.unit_price) ? it.unit_price : 0
    return s + q * up
  }, 0)

  const totalAmountRaw = (request && ("total_amount" in request) ? (request as Record<string, unknown>)["total_amount"] : undefined)
  const totalToShow = Number.isFinite(safeNum(totalAmountRaw)) ? safeNum(totalAmountRaw) : computedTotal

 

  return (
    <div className="max-w-4xl mx-auto p-6">
      <RequestHeader />

      {loading && <div className="text-sm text-slate-500">Loading…</div>}
      {error && <div className="text-sm text-rose-600">{error}</div>}
      {!loading && !request && !error && <div className="text-sm text-slate-500">No request selected.</div>}

      {request && (
        <section className="bg-white border rounded shadow-sm p-6 space-y-6">
          <header>
            <div className="mb-2">
              <span className="text-xs text-slate-400 font-semibold mr-2">Title:</span>
              <h2 className="text-lg font-semibold text-slate-800 inline">{request.title ?? "Untitled request"}</h2>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold mr-2">Description:</span>
              <span className="text-sm text-slate-500">{request.description ?? "No description"}</span>
            </div>
          </header>

          {requestForMeta && <MetaGrid request={requestForMeta} />}

          <div>
            <h3 className="text-sm font-medium text-slate-800 mb-3">Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-auto border-collapse">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3 w-28 text-right">Quantity</th>
                    <th className="py-2 px-3 w-32 text-right">Unit price</th>
                    <th className="py-2 px-3 w-32 text-right">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => {
                    const qty = Number.isFinite(it.quantity) ? it.quantity : 0
                    const up = Number.isFinite(it.unit_price) ? it.unit_price : 0
                    const line = qty * up
                    return (
                      <tr key={i} className="border-b last:border-b-0">
                        <td className="py-2 px-3">{it.name}</td>
                        <td className="py-2 px-3 text-right">{Number.isFinite(it.quantity) ? String(it.quantity) : "—"}</td>
                        <td className="py-2 px-3 text-right">{Number.isFinite(it.unit_price) ? formatFrw(it.unit_price) : "—"}</td>
                        <td className="py-2 px-3 text-right font-medium">{Number.isFinite(line) ? formatFrw(line) : "—"}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td />
                    <td />
                    <td className="py-2 px-3 text-right text-xs text-slate-500">Total</td>
                    <td className="py-2 px-3 text-right font-semibold">{formatFrw(totalToShow)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="text-sm text-slate-500">
           
            {request.approved_by_user && (
              <div>
                Approved by: <span className="text-slate-700 font-medium">{request.approved_by_user.full_name ?? request.approved_by_user.name}</span>
              </div>
            )}
            <div>
              Approval progress: <span className="text-slate-700 font-medium">{(request.current_approval_level ?? 0)} / {(request.required_approval_levels ?? "—")}</span>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}