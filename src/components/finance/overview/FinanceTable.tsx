"use client"

import React from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import {
  MoreHorizontal,
  Eye,
  DollarSign,
  Calendar,
  FolderOpen,
  CheckCircle,
  FileText,
  Trash2,
} from "lucide-react"
import { FinanceRequest,formatFrwCompact} from "./FinanceOverviewPage"
import toast from "react-hot-toast"
import api from "@/lib/api"
import { ConfirmDialog } from "@/components/confirm-dialog"

type FinanceTableProps = {
  requests: FinanceRequest[]
  openMenuId: number | string | null
  setOpenMenuId: React.Dispatch<React.SetStateAction<number | string | null>>
  setMenuAnchor: React.Dispatch<React.SetStateAction<DOMRect | null>>
  menuAnchor: DOMRect | null
  PopupMenu: React.FC<{ anchor: DOMRect | null; children: React.ReactNode; onClose: () => void }>
}

export default FinanceTable

export function FinanceTable({
  requests,
  openMenuId,
  setOpenMenuId,
  setMenuAnchor,
  menuAnchor,
  PopupMenu,
}: FinanceTableProps) {
  const [deletingId, setDeletingId] = React.useState<number | string | null>(null)
  const [localRequests, setLocalRequests] = React.useState<FinanceRequest[]>(requests ?? [])
  const [confirmOpenId, setConfirmOpenId] = React.useState<number | string | null>(null)

  React.useEffect(() => {
    setLocalRequests(requests ?? [])
  }, [requests])

  // Helper to perform a delete by id (reused by row DeleteButton and dev test button)
  async function performDelete(id: number | string) {
    console.debug("finance: performDelete", id)
    const toastId = toast.loading("Deleting request...")
    setDeletingId(id)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`

      const url = `/purchases/requests/${id}/`
      console.debug("finance: deleting url and headers", { url, headers })

      const res = await api.delete(url, { headers })
      console.debug("DELETE response", res?.status, res?.data)
      setLocalRequests((prev) => prev.filter((it) => String(it.id) !== String(id)))
      toast.success("Request deleted", { id: toastId })
      setOpenMenuId(null)
      setMenuAnchor(null)
    } catch (err: unknown) {
      try {
        const anyErr = err as { response?: { status?: number; data?: unknown }; message?: string }
        console.error("performDelete error", {
          message: anyErr?.message,
          status: anyErr?.response?.status,
          data: anyErr?.response?.data,
        })
      } catch (e) {
        console.error("performDelete unknown error", err)
      }
      const anyErr = err as { response?: { status?: number; data?: unknown }; message?: string }
      if (anyErr?.response) {
        const status = anyErr.response.status
        const data = anyErr.response.data as any
        const msg = data?.detail ?? data?.message ?? JSON.stringify(data)
        if (status === 401) {
          toast.error("Unauthorized (401). Please sign in again.", { id: toastId })
          if (typeof window !== "undefined") localStorage.removeItem("token")
        } else if (typeof status === "number" && status >= 400 && status < 500) {
          toast.error(`Failed to delete (status ${status}): ${String(msg)}`, { id: toastId })
        } else if (typeof status === "number") {
          toast.error(`Server error (${status}). See console for details.`, { id: toastId })
        } else {
          toast.error(`Failed to delete request: ${String(msg)}`, { id: toastId })
        }
      } else {
        toast.error(String(anyErr?.message ?? "Failed to delete request"), { id: toastId })
      }
    } finally {
      setDeletingId(null)
      toast.dismiss(toastId)
    }
  }

  // Inline simple modal confirm (self-contained) to avoid external dialog issues
  function ConfirmModal({ id, title, description, onConfirm, onCancel }: { id: number | string; title?: string; description?: string; onConfirm: () => void; onCancel: () => void }) {
    if (typeof document === "undefined") return null
    return createPortal(
      <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onCancel}>
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-slate-900">{title ?? "Confirm delete"}</h3>
                {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50">
            <button onClick={onCancel} className="px-4 py-2 rounded-md border bg-white text-sm text-slate-700 hover:bg-slate-100">Cancel</button>
            <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-rose-600 text-white text-sm hover:bg-rose-700">Delete</button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return (
    <>
      {/* Dev helper: quick-delete endpoint /purchases/requests/4/ for testing */}
      <div className="mb-3">
        <button
          type="button"
          onClick={() => performDelete(4)}
          className="px-3 py-1 text-xs rounded bg-rose-100 text-rose-700 mr-2"
        >
          Dev: Delete /purchases/requests/4/
        </button>
      </div>
      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-3">
        {localRequests.map((r) => (
          <div key={r.id} className="bg-white border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <div className="font-medium text-slate-800 truncate">{r.title}</div>
                {r.description && (
                  <div className="text-xs text-slate-500 mt-1 line-clamp-2">{r.description}</div>
                )}
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                  <span>Amount: <strong className="text-slate-900">{r.total_amount ? formatFrwCompact(Number(r.total_amount)) : "—"}</strong></span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">{r.status}</span>
                </div>
              </div>
              <div className="text-right ml-3 flex-shrink-0">
                <Link href={`/dashboards/finance/${r.id}`} className="text-sm text-sky-600 hover:underline">View</Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop/tablet: regular table */}
      <table className="hidden md:table w-full text-sm table-auto">
      <thead>
        <tr className="text-left text-slate-500 border-b">
          <th className="py-3 px-4 min-w-[38%]">Title</th>
          <th className="py-3 px-4 w-36 text-right">
            Amount <DollarSign className="inline-block w-4 h-4 ml-1 text-slate-400" />
          </th>
          <th className="py-3 px-4 w-28">Status</th>
          <th className="py-3 px-4 w-36">
            Created <Calendar className="inline-block w-4 h-4 ml-1 text-slate-400" />
          </th>
          <th className="py-3 px-4 w-24 text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        {localRequests.map((r) => (
          <tr key={r.id} className="border-b last:border-b-0 hover:bg-slate-50 transition-colors">
            <td className="py-3 px-4 flex items-start gap-3 min-w-0">
              <div className="shrink-0 rounded-full bg-slate-100 w-9 h-9 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-slate-500" />
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
              {r.total_amount !== undefined && r.total_amount !== null
                ? formatFrwCompact(Number(r.total_amount))
                : "—"}
            </td>
            <td className="py-3 px-4">
              <div className="inline-flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="inline-block px-2 py-1 text-xs rounded bg-emerald-100 text-emerald-700">
                  {r.status}
                </span>
              </div>
            </td>
            <td className="py-3 px-4 text-slate-500">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</span>
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
                {openMenuId === r.id && menuAnchor && (
                  <PopupMenu
                    anchor={menuAnchor}
                    onClose={() => {
                      setOpenMenuId(null)
                      setMenuAnchor(null)
                    }}
                  >
                    <div className="py-1">
                      <Link
                        href={`/dashboards/finance/${r.id}`}
                        onClick={() => {
                          setOpenMenuId(null)
                          setMenuAnchor(null)
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="w-4 h-4 text-slate-500" /> View
                      </Link>

                      {/* only allow delete for approved requests (finance can delete approved) */}
                      {String(r.status ?? "").toUpperCase() === "APPROVED" && (
                        <>
                          <button
                            type="button"
                            disabled={deletingId === r.id}
                            onClick={() => setConfirmOpenId(r.id)}
                            className={`px-3 py-2 text-sm text-rose-600 hover:bg-slate-50 rounded ${deletingId === r.id ? "opacity-50" : ""}`}
                            aria-disabled={deletingId === r.id}
                          >
                            <span className="inline-flex items-center gap-2">
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </span>
                          </button>
                          {confirmOpenId === r.id && (
                            <ConfirmModal
                              id={r.id}
                              title={`Are you sure you want to delete this request?`}
                              description="This will permanently remove the approved request and its related data. This action cannot be undone."
                              onCancel={() => setConfirmOpenId(null)}
                              onConfirm={async () => {
                                setConfirmOpenId(null)
                                await performDelete(r.id)
                              }}
                            />
                          )}
                        </>
                      )}
                     
                      <Link
                        href={`/dashboards/finance/document/view-receipt/${r.id}`}
                        onClick={() => {
                          setOpenMenuId(null)
                          setMenuAnchor(null)
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-700 hover:bg-slate-50"
                      >
                        <FileText className="w-4 h-4 text-indigo-500" /> View Documents
                      </Link>
                    </div>
                  </PopupMenu>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </>
  )
}