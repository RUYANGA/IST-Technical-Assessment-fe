import React from "react"
import Link from "next/link"
import {
  MoreHorizontal,
  Eye,
  DollarSign,
  Calendar,
  FolderOpen,
  CheckCircle,
  Upload,
  FileText,
} from "lucide-react"
import { FinanceRequest,formatFrwCompact} from "./FinanceOverviewPage"

type FinanceTableProps = {
  requests: FinanceRequest[]
  openMenuId: number | string | null
  setOpenMenuId: React.Dispatch<React.SetStateAction<number | string | null>>
  setMenuAnchor: React.Dispatch<React.SetStateAction<DOMRect | null>>
  menuAnchor: DOMRect | null
  PopupMenu: React.FC<{ anchor: DOMRect | null; children: React.ReactNode; onClose: () => void }>
}

export function FinanceTable({
  requests,
  openMenuId,
  setOpenMenuId,
  setMenuAnchor,
  menuAnchor,
  PopupMenu,
}: FinanceTableProps) {
  return (
    <table className="w-full text-sm table-auto">
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
        {requests.map((r) => (
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
                      <Link
                        href={`/dashboards/finance/document/${r.id}`}
                        onClick={() => {
                          setOpenMenuId(null)
                          setMenuAnchor(null)
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-sky-700 hover:bg-slate-50"
                      >
                        <Upload className="w-4 h-4 text-sky-500" /> Upload Receipt/Invoice
                      </Link>
                      <Link
                        href={`/finance/requests/${r.id}/documents`}
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
  )
}