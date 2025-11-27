"use client"
import toast from "react-hot-toast"
import api from "@/lib/api"
import type { AxiosInstance } from "axios"

export type User = {
  id?: number | string
  first_name?: string
  last_name?: string
  email?: string
  name?: string
  full_name?: string
}

export type Approval = {
  id?: number | string
  approver?: number | string | User | null
  approved_at?: string
  level?: number
}

export type RequestItem = {
  id: number | string
  title?: string
  description?: string
  amount?: number | string
  total_amount?: number | string
  status?: "PENDING" | "APPROVED" | "REJECTED"
  created_at?: string
  items?: Array<{ name?: string; quantity?: number | string; unit_price?: number | string }>
  approved_by?: string | number | User
  approvals?: Approval[] // if backend returns approvals on /requests/:id/
  // enrichment
  approved_by_user?: User | null
  // approval workflow fields
  current_approval_level?: number
  required_approval_levels?: number
}

export type StaffStats = {
  total: number
  pending: number
  approved: number
  rejected: number
  total_amount: number
}

/**
 * Factory that returns a small service object for staff-related API calls.
 * Accepts a custom client for easier testing (Dependency Inversion).
 */
export function createStaffService(client: AxiosInstance = api) {
  return {
    async fetchRecent(token?: string): Promise<RequestItem[]> {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await client.get<RequestItem[]>("/purchases/requests/?mine=true", { headers })
        return res.data ?? []
      } catch {
        toast.error("Failed to load recent requests")
        return []
      }
    },

    async fetchStats(token?: string): Promise<StaffStats | null> {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        // prefer dedicated stats endpoint when available
        try {
          const res = await client.get<StaffStats>("/purchases/requests/stats/?mine=true", { headers })
          return res.data ?? null
        } catch (err: any) {
          // if the backend doesn't expose a stats endpoint, fall back to listing and compute locally
          if (err?.response?.status === 404) {
            console.debug("stats endpoint not found, falling back to list and computing stats")
            const listRes = await client.get<RequestItem[]>("/purchases/requests/?mine=true", { headers })
            const items = listRes.data ?? []
            const stats: StaffStats = {
              total: items.length,
              pending: items.filter((i) => String(i.status ?? "").toUpperCase() === "PENDING").length,
              approved: items.filter((i) => String(i.status ?? "").toUpperCase() === "APPROVED").length,
              rejected: items.filter((i) => String(i.status ?? "").toUpperCase() === "REJECTED").length,
              total_amount: items.reduce((sum, it) => sum + Number(it.total_amount ?? it.amount ?? 0), 0),
            }
            return stats
          }
          throw err
        }
      } catch (e) {
        return null
      }
    },

    async deleteRequest(id: number | string, token?: string): Promise<void> {
      const toastId = toast.loading("Deleting request…")
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        await client.delete(`/purchases/requests/${id}/`, { headers })
        toast.success("Request deleted", { id: toastId })
      } catch (err) {
        toast.error("Delete failed", { id: toastId })
        throw err
      }
    },

    async updateRequest(id: number | string, payload: Partial<RequestItem>, token?: string) {
      const toastId = toast.loading("Updating request…")
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await client.patch<RequestItem>(`/purchases/requests/${id}/`, payload, { headers })
        toast.success("Request updated", { id: toastId })
        return res.data
      } catch (err) {
        toast.error("Update failed", { id: toastId })
        throw err
      }
    },


    // fetch request details (returns approvals when backend includes them)
    async fetchRequest(id: number | string, token?: string): Promise<RequestItem | null> {
      if (id == null) return null
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await client.get<RequestItem>(`/purchases/requests/${id}/`, { headers }) // e.g. http://127.0.0.1:8000/api/purchases/requests/1/
        return res.data ?? null
      } catch {
        toast.error("Failed to load request")
        return null
      }
    },
  }
}

export default createStaffService