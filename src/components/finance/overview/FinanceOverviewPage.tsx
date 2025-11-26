"use client"

import { useEffect, useRef, useState } from "react"
import api from "@/lib/api"
import {
  DollarSign,
  Layers,
  RefreshCw,
  FolderOpen,
  CheckCircle,
  Receipt,
  FileText,
} from "lucide-react"
import { DashboardCard } from "./DashboardCard"
import { FinanceTable } from "./FinanceTable"
import { PopupMenu } from "./PopupMenu"
import { AxiosError } from "axios"

// --- Types ---
export type FinanceRequest = {
  id: number | string
  title: string
  description?: string
  amount?: number
  total_amount?: number
  status: string
  created_at?: string
}

type Stats = {
  total: number
  approved: number
}

// compact FRW: 1_000 -> Frw 1K, 1_000_000 -> Frw 1M
export function formatFrwCompact(value: number) {
  if (!Number.isFinite(value)) return "—"
  const abs = Math.abs(Math.round(value))
  if (abs >= 1_000_000) return `Frw ${Math.round(value / 1_000_000)}M`
  if (abs >= 1_000) return `Frw ${Math.round(value / 1_000)}K`
  return `Frw ${Math.round(value).toLocaleString()}`
}

// --- Data Fetching ---
async function fetchAllRequests(): Promise<FinanceRequest[]> {
  const res = await api.get("/purchases/requests/")
  const data: unknown = res.data ?? []
  if (Array.isArray(data)) return data as FinanceRequest[]
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.results)) return obj.results as FinanceRequest[]
    if (Array.isArray(obj.data)) return obj.data as FinanceRequest[]
  }
  return []
}

// --- Main Page ---
export default function FinanceOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<FinanceRequest[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, approved: 0 })
  const [openMenuId, setOpenMenuId] = useState<number | string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null)
  const tableRef = useRef<HTMLDivElement | null>(null)

  // receipts count state (declare before useEffect so setReceiptsCount is available)
  const [receiptsCount, setReceiptsCount] = useState<number>(0)
  // purchase orders count
  const [ordersCount, setOrdersCount] = useState<number>(0)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const all = await fetchAllRequests()
        const approvedRequests = all.filter((r) => String(r.status ?? "").toUpperCase() === "APPROVED")

        // robust receipts counting with logging + fallback paths
        const receiptsPerRequest = await Promise.allSettled(
          all.map(async (req) => {
            const id = String(req.id)
            const paths = [`/purchases/requests/${id}/receipts/`, `/purchases/requests/${id}/receipts`]
            for (const p of paths) {
              try {
                const res = await api.get(p)
                const data: unknown = res.data ?? []
        
                console.debug("receipts response", id, p, { status: res.status, data })
                if (Array.isArray(data)) return data.length
                if (data && typeof data === "object") {
                  const obj = data as Record<string, unknown>
                  if (typeof obj.count === "number") return obj.count
                  if (Array.isArray(obj.results)) return obj.results.length
                  if (Array.isArray(obj.data)) return obj.data.length
                  // if object contains receipts key
                  if (Array.isArray(obj.receipts)) return obj.receipts.length
                }
                // not recognized -> treat as zero for this path and try next path
              } catch (err) {
                
                console.warn("receipts fetch failed", id, p, (err as AxiosError)?.response?.status, (err as AxiosError)?.message)
                // try next path
              }
            }
            return 0
          })
        )

        // reduce settled results into total
        const totalReceipts = receiptsPerRequest.reduce((sum, r) => {
          if (r.status === "fulfilled") {
            const v = r.value as number
            return sum + (Number.isFinite(v) ? v : 0)
          }
         
          console.warn("receipts fetch rejected", r)
          return sum
        }, 0)

        setRequests(approvedRequests)
        setStats({
          total: all.length,
          approved: approvedRequests.length,
        })
        setReceiptsCount(totalReceipts)
        // fetch purchase orders count (robust to different backend shapes)
        try {
          const resOrders = await api.get("/purchases/purchase-orders/")
          const ordersData: unknown = resOrders.data ?? []
          let count = 0
          if (Array.isArray(ordersData)) count = ordersData.length
          else if (ordersData && typeof ordersData === "object") {
            const obj = ordersData as Record<string, unknown>
            if (typeof obj.count === "number") count = obj.count
            else if (Array.isArray(obj.results)) count = obj.results.length
            else if (Array.isArray(obj.data)) count = obj.data.length
            else if (typeof obj.total === "number") count = obj.total
          }
          setOrdersCount(count)
        } catch (err) {
          console.warn("orders fetch failed", err)
          setOrdersCount(0)
        }
      } catch (err) {
        setRequests([])
        setStats({ total: 0, approved: 0 })
       
        console.error("FinanceOverview load error", err)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-100 rounded w-1/3" />

          <section className="grid grid-cols-1 sm:grid-cols-5 gap-6">
            <div className="h-28 p-6 bg-slate-100 rounded-lg" />
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
            {loading ? (
              <span className="inline-block h-7 w-40 bg-slate-100 rounded animate-pulse" />
            ) : (
              "Finance Overview"
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? (
              <span className="inline-block h-4 w-64 bg-slate-100 rounded animate-pulse" />
            ) : (
              "Review, manage approved finance requests, upload receipts/invoices, and view documents."
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-3 py-2 border rounded text-sm gap-2 hover:bg-slate-50"
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
        <DashboardCard
          icon={<FolderOpen className="w-7 h-7 text-slate-600" />}
          label="Requests"
          value={stats.total}
        />
        <DashboardCard
          icon={<CheckCircle className="w-7 h-7 text-emerald-500" />}
          label="Approved"
          value={stats.approved}
        />
        <DashboardCard
          icon={<Receipt className="w-7 h-7 text-amber-500" />}
          label="Receipts"
          value={loading ? "—" : receiptsCount}
        />
        <DashboardCard
          icon={<FileText className="w-7 h-7 text-rose-500" />}
          label="Orders"
          value={loading ? "—" : ordersCount}
        />
        <DashboardCard
          icon={<DollarSign className="w-7 h-7 text-slate-600" />}
          label="Total Approved"
          value={formatFrwCompact(
            requests
              .filter((r: FinanceRequest) => r.status === "APPROVED" && r.total_amount !== undefined)
              .reduce((sum, r) => sum + Number(r.total_amount), 0)
          )}
        />
      </section>

      <section className="bg-white rounded shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-600" /> Recent Finance Requests
          </h2>
        </div>
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 bg-slate-100 rounded" />
            <div className="h-8 bg-slate-100 rounded" />
            <div className="h-8 bg-slate-100 rounded" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-sm text-slate-500">No finance requests yet.</div>
        ) : (
          <div ref={tableRef} className="overflow-x-auto">
            <FinanceTable
              requests={requests.slice(0, 12)}
              openMenuId={openMenuId}
              setOpenMenuId={setOpenMenuId}
              setMenuAnchor={setMenuAnchor}
              menuAnchor={menuAnchor}
              PopupMenu={PopupMenu}
            />
          </div>
        )}
      </section>
    </div>
  )
}