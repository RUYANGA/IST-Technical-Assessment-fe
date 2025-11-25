"use client"
import React, { useEffect, useRef, useState, useMemo } from "react"
import Link from "next/link"
import useStaffOverview from "./hooks/useStaffRequests"
import type { RequestItem } from "./services/staffService"
import {
  MoreHorizontal,
  Eye,
  Edit2,
  Trash2,
  DollarSign,
  Layers,

  Calendar,
  RefreshCw,
  Plus,
  List,
  CheckCircle,
  Clock,
  Package,
  XCircle,
} from "lucide-react"
import { createPortal } from "react-dom"
import { DeleteButton } from "@/components/deleteDialoge"

export default function StaffOverviewPage() {
  const { loading, recent, stats, refresh, deleteRequest } = useStaffOverview()
  const [deletingId, setDeletingId] = useState<number | string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<number | string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null)
  const tableRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

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
    const items = Array.isArray(rec.items) ? rec.items as Array<Record<string, unknown>> : []
    if (items.length) {
      return items.reduce((sum: number, it) => {
        const q = safeNum(it.quantity) || 0
        const up = safeNum(it.unit_price) || 0
        return sum + q * up
      }, 0)
    }

    return NaN
  }

  // total spent (only APPROVED requests)
  const approvedTotal = useMemo(() => {
    return recent.reduce((sum, r) => {
      const amt = computeAmount(r)
      return sum + (r.status === "APPROVED" && Number.isFinite(amt) ? amt : 0)
    }, 0)
  }, [recent])

  function formatFrw(value: number) {
    if (!Number.isFinite(value)) return "—"
    // Rwandan franc typically shown without decimals
    return `Frw ${Math.round(value).toLocaleString()}`
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

  // compact FRW: 1_000 -> Frw 1K, 1_000_000 -> Frw 1M
  function formatFrwCompact(value: number) {
    if (!Number.isFinite(value)) return "—"
    const abs = Math.abs(Math.round(value))
    if (abs >= 1_000_000) return `Frw ${Math.round(value / 1_000_000)}M`
    if (abs >= 1_000) return `Frw ${Math.round(value / 1_000)}K`
    return `Frw ${Math.round(value).toLocaleString()}`
  }
  // close when clicking outside portal menu or the table
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node
      // if click inside table, keep handling (existing behavior)
      if (tableRef.current && tableRef.current.contains(target)) {
        // If click inside a menu button we let its handler toggle
        // otherwise don't auto-close here (menu portal is outside table)
        return
      }
      // if click inside menu portal, keep open
      if (menuRef.current && menuRef.current.contains(target)) return
      // else close menu
      setOpenMenuId(null)
      setMenuAnchor(null)
    }

    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

 
  // delete flow used by ConfirmDialog / DeleteButton (no inline confirm)
  async function deleteNow(id: number | string) {
    setDeletingId(id)
    setOpenMenuId(null)
    const ok = await deleteRequest(id)
    setDeletingId(null)
    if (!ok) alert("Delete failed")
  }

  // Portal menu renderer — positions a popup based on anchor rect
  function PopupMenu({ anchor, children }: { anchor: DOMRect | null; children: React.ReactNode }) {
    const elRef = useRef<HTMLElement | null>(null)
    if (!elRef.current && typeof document !== "undefined") {
      elRef.current = document.createElement("div")
    }

    useEffect(() => {
      const host = elRef.current!
      document.body.appendChild(host)
      return () => {
        if (host.parentNode) host.parentNode.removeChild(host)
      }
    }, [])

    if (!anchor || !elRef.current) return null

    const top = anchor.bottom + window.scrollY + 6
    // prefer aligning right edge of menu with button right edge, but clamp to viewport
    const menuWidth = 192 // approx w-48
    let left = anchor.right + window.scrollX - menuWidth
    if (left < 8) left = anchor.left + window.scrollX
    if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8

    const menu = (
      <div
        ref={menuRef}
        style={{ position: "absolute", top, left, width: menuWidth, zIndex: 9999 }}
        className="w-48 bg-white border shadow-sm rounded"
      >
        {children}
      </div>
    )

    return createPortal(menu, elRef.current)
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
          <h1 className="text-2xl font-semibold flex items-center gap-3">
            Staff Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">Create and track your purchase requests.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboards/staff/new-request"
            className="inline-flex items-center px-4 py-2 bg-sky-600 text-white rounded shadow-sm text-sm gap-2 hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <Plus className="w-4 h-4" /> New Request
          </Link>

          <Link
            href="/dashboards/staff/requests"
            className="inline-flex items-center px-4 py-2 border rounded text-sm gap-2 hover:bg-slate-50"
          >
            <List className="w-4 h-4 text-slate-600" /> My Requests
          </Link>

          <button
            onClick={refresh}
            className="inline-flex items-center px-3 py-2 border rounded text-sm gap-2 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" /> Refresh
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
        <div className="p-4 sm:p-6 md:p-8 bg-white rounded-lg shadow-md flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 md:p-4 rounded-lg bg-slate-100">
            <List className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-slate-600" />
          </div>
          <div className="flex-1">
            <div className="text-xs sm:text-sm md:text-base text-slate-500">Requests</div>
            <div className="text-xl sm:text-2xl md:text-3xl font-semibold">{loading ? "—" : stats.total}</div>
          </div>
        </div>

        <div className="p-4 sm:p-6 md:p-8 bg-white rounded-lg shadow-md flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 md:p-4 rounded-lg bg-amber-50">
            <Clock className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-amber-500" />
          </div>
          <div className="flex-1">
            <div className="text-xs sm:text-sm md:text-base text-slate-500">Pending</div>
            <div className="text-xl sm:text-2xl md:text-3xl font-semibold text-emerald-600">{loading ? "—" : stats.pending}</div>
          </div>
        </div>

        <div className="p-4 sm:p-6 md:p-8 bg-white rounded-lg shadow-md flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 md:p-4 rounded-lg bg-emerald-50">
            <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-emerald-500" />
          </div>
          <div className="flex-1">
            <div className="text-xs sm:text-sm md:text-base text-slate-500">Approved</div>
            <div className="text-xl sm:text-2xl md:text-3xl font-semibold text-emerald-600">{loading ? "—" : stats.approved}</div>
          </div>
        </div>


        <div className="p-4 sm:p-6 md:p-8 bg-white rounded-lg shadow-md flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 md:p-4 rounded-lg bg-emerald-50">
            <XCircle className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-emerald-500" />
          </div>
          <div className="flex-1">
            <div className="text-xs sm:text-sm md:text-base text-slate-500">Rejected</div>
            <div className="text-xl sm:text-2xl md:text-3xl font-semibold text-emerald-600">{loading ? "—" : stats.rejected}</div>
          </div>
        </div>


        <div className="p-4 sm:p-6 md:p-8 bg-white rounded-lg shadow-md flex items-center gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 md:p-4 rounded-lg bg-slate-50">
            <DollarSign className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-slate-600" />
          </div>
          <div className="flex-1">
            <div className="text-xs sm:text-sm md:text-base text-slate-500">Approved</div>
            <div className="text-xl sm:text-2xl md:text-3xl font-semibold">{loading ? "—" : formatFrwCompact(approvedTotal)}</div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-600" /> Recent Requests
          </h2>

          <div className="flex items-center gap-2">
            <Link href="/dashboards/staff/requests" className="text-sm text-sky-600 flex items-center gap-1">
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
        ) : recent.length === 0 ? (
          <div className="text-sm text-slate-500">No requests yet. Create your first request.</div>
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
                {recent.slice(0, 12).map((r) => (
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
                        const amt = computeAmount(r)
                        return Number.isFinite(amt) ? formatFrw(amt) : "—"
                      })()}
                    </td>

                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-2">
                        {r.status === "APPROVED" && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                        {r.status === "PENDING" && <Clock className="w-4 h-4 text-amber-500" />}
                        {r.status === "REJECTED" && <Trash2 className="w-4 h-4 text-rose-500" />}
                        <span className={
                          `inline-block px-2 py-1 text-xs rounded ${r.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : r.status === "REJECTED" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`
                        }>
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
                        <button
                          aria-haspopup="true"
                          aria-expanded={openMenuId === r.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            const btn = e.currentTarget as HTMLElement
                            const rect = btn.getBoundingClientRect()
                            setOpenMenuId((prev) => {
                              const next = prev === r.id ? null : r.id
                              setMenuAnchor(next ? rect : null)
                              return next
                            })
                          }}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 focus:outline-none"
                          title="Actions"
                        >
                          <MoreHorizontal className="w-4 h-4 text-slate-600" />
                        </button>

                        {/* render popup via portal so it doesn't affect table layout */}
                        {openMenuId === r.id && menuAnchor && (
                          <PopupMenu anchor={menuAnchor}>
                            <div className="py-1">
                              <Link
                                href={`/dashboards/staff/requests/${r.id}`}
                                onClick={() => {
                                  setOpenMenuId(null)
                                  setMenuAnchor(null)
                                }}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <Eye className="w-4 h-4 text-slate-500" /> View
                              </Link>
                              {r.status === "APPROVED" ? (
                                <>
                                  <div
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
                                    title="Cannot edit an approved request"
                                    aria-disabled="true"
                                    tabIndex={-1}
                                    role="button"
                                  >
                                    <Edit2 className="w-4 h-4 text-slate-400" /> Edit
                                  </div>
                                  <button
                                    disabled
                                    className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
                                    title="Cannot delete an approved request"
                                    aria-disabled="true"
                                    tabIndex={-1}
                                  >
                                    <Trash2 className="w-4 h-4 text-slate-400" />
                                    Delete
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Link
                                    href={`/dashboards/staff/edit/${r.id}`}
                                    onClick={() => {
                                      setOpenMenuId(null)
                                      setMenuAnchor(null)
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    <Edit2 className="w-4 h-4 text-slate-500" /> Edit
                                  </Link>
                                  <DeleteButton
                                    disabled={deletingId === r.id}
                                    title={`Are you sure you want to delete this?`}
                                    description="This will permanently remove the request and its related data. This action cannot be undone."
                                    handleDelete={async () => {
                                      await deleteNow(r.id)
                                    }}
                                  />
                                </>
                              )}
                            </div>
                          </PopupMenu>
                        )}
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