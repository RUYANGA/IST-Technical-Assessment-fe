"use client"
import toast from "react-hot-toast"
import api from "@/lib/api"
import type { AxiosInstance } from "axios"
import { AxiosError } from "axios"

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
 * Types for /approvals/mine/ responses
 */
export type ApprovalEntry = {
  approval_id?: number | string
  purchase_request_id?: number | string
  level?: number
  approved_at?: string
  purchase_request_status?: string
  purchase_request?: Partial<RequestItem>
  request?: Partial<RequestItem>
  // allow other fields from API — use unknown instead of `any`
  [key: string]: unknown
}

export type ApprovalsApiObject = {
  approved_requests?: ApprovalEntry[]
  pending_requests?: ApprovalEntry[]
  approvals?: ApprovalEntry[]
  results?: ApprovalEntry[]
  data?: ApprovalEntry[]
  // other top-level keys allowed
  [key: string]: unknown
}

export type ApprovalsApiResult = ApprovalEntry[] | ApprovalsApiObject

/**
 * Factory that returns a small service object for staff-related API calls.
 * Accepts a custom client for easier testing (Dependency Inversion).
 */
export function createStaffService(client: AxiosInstance = api) {
  return {
    // fetch approvals assigned to me — return approval payload (hook will normalize)
    async fetchRecent(token?: string): Promise<ApprovalsApiResult> {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await client.get<ApprovalsApiResult>("/approvals/mine/", { headers })
        return (res.data ?? {}) as ApprovalsApiResult
      } catch (err) {
        console.error("fetchRecent /approvals/mine/ error:", err)
        toast.error("Failed to load approvals")
        return {} as ApprovalsApiResult
      }
    },

    // fetch raw rejected-requests payload (returns ApprovalEntry[] or object containing rejected_requests)
    async fetchMineRejectedEntries(token?: string): Promise<ApprovalEntry[]> {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await client.get("/approvals/mine/rejected/", { headers })
        const data: unknown = res.data ?? {}

        // If API returns array directly
        if (Array.isArray(data)) return data as ApprovalEntry[]

        // If API returns an object e.g. { rejected_requests: [...] }
        if (data && typeof data === "object") {
          const obj = data as Record<string, unknown>
          const candidates = ["rejected_requests", "rejected", "results", "data", "items"]
          for (const k of candidates) {
            const val = obj[k]
            if (Array.isArray(val)) return val as ApprovalEntry[]
          }
        }

        return []
      } catch (err) {
        console.error("fetchMineRejectedEntries /approvals/mine/rejected/ error:", err)
        toast.error("Failed to load rejected approvals")
        return []
      }
    },

    // fetch stats for all requests (not restricted to "mine")
    async fetchStats(token?: string): Promise<StaffStats | null> {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await client.get<StaffStats>("/purchases/requests/stats/", { headers })
        return res.data ?? null
      } catch {
        return null
      }
    },

    /**
     * Update request status by calling the backend approve/reject endpoints.
     * Usage: svc.updateRequest(id, { status: "APPROVED" }) or { status: "REJECTED" }
     */
    async updateRequest(id: number | string, payload: { status: "APPROVED" | "REJECTED" }, token?: string): Promise<boolean> {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const action = payload.status === "APPROVED" ? "approve" : "reject"
      const url = `/purchases/requests/${id}/${action}/`

      // try a few HTTP methods if server returns 405 (method not allowed)
      const tryMethods = async (): Promise<void> => {
        // preferred: POST
        await client.post(url, {}, { headers })
      }

      try {
        try {
          await tryMethods()
          return true
        } catch (err) {
          const axErr = err as AxiosError | undefined
          if (axErr?.response?.status === 405) {
            // fallback to PATCH then PUT if POST is not allowed
            try {
              await client.patch(url, {}, { headers })
              return true
            } catch (err2) {
              const axErr2 = err2 as AxiosError | undefined
              if (axErr2?.response?.status === 405) {
                // final fallback
                await client.put(url, {}, { headers })
                return true
              }
              throw err2
            }
          }
          throw err
        }
      } catch (err) {
        console.error("updateRequest error:", err)
        toast.error("Failed to update request")
        return false
      }
    },

    // delete request (helper used by UI)
    async deleteRequest(id: number | string, token?: string): Promise<boolean> {
      const t = toast.loading("Deleting request…")
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        await client.delete(`/purchases/requests/${id}/`, { headers })
        toast.success("Deleted", { id: t })
        return true
      } catch {
        toast.error("Delete failed", { id: t })
        return false
      }
    },

    // fetch request details (returns approvals when backend includes them)
    async fetchRequest(id: number | string, token?: string): Promise<RequestItem | null> {
      if (id == null) return null
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await client.get<RequestItem>(`/purchases/requests/${id}/`, { headers })
        return res.data ?? null
      } catch {
        toast.error("Failed to load request")
        return null
      }
    },

    // fetch pending purchase requests (for approvers to review)
    async fetchPending(token?: string): Promise<RequestItem[]> {
      const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null

      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await client.get("/purchases/requests/pending/", { headers })
        const data: unknown = res.data ?? {}

        // canonicalize response: accept array or { results: [...] } or various wrappers
        let items: unknown[] = []
        if (Array.isArray(data)) {
          items = data
        } else if (isObject(data)) {
          const obj = data
          if (Array.isArray(obj.results)) items = obj.results as unknown[]
          else if (Array.isArray(obj.data)) items = obj.data as unknown[]
          else if (Array.isArray(obj.pending_requests)) {
            items = (obj.pending_requests as unknown[]).map((e) => {
              if (isObject(e) && isObject((e as Record<string, unknown>).purchase_request)) {
                return (e as Record<string, unknown>).purchase_request
              }
              if (isObject(e) && isObject((e as Record<string, unknown>).request)) {
                return (e as Record<string, unknown>).request
              }
              return e
            })
          } else if ("id" in obj) {
            items = [obj]
          }
        }

        // normalize to RequestItem
        const normalized: RequestItem[] = items.map((p: unknown) => {
          const rec = isObject(p) ? p : {}
          const get = (k: string) => {
            const v = rec[k]
            return v === undefined ? undefined : v
          }

          const statusRaw = get("status") ?? get("purchase_request_status") ?? ""
          const status = String(statusRaw ?? "").toUpperCase() as RequestItem["status"]

          const created_at = get("created_at") ?? get("createdAt") ?? get("created")
          const currentLevel = get("current_approval_level") ?? get("current_level")
          const requiredLevels = get("required_approval_levels") ?? get("required_approval_level")

          return {
            id: (get("id") ?? get("request_id") ?? get("purchase_request_id")) as number | string,
            title: (get("title") ?? get("name")) as string | undefined,
            description: (get("description") ?? get("details")) as string | undefined,
            amount: (get("amount") ?? get("total_amount")) as number | string | undefined,
            total_amount: get("total_amount") as number | string | undefined,
            status: (status || undefined) as RequestItem["status"],
            created_at: (created_at as string) ?? undefined,
            items: Array.isArray(rec.items) ? (rec.items as RequestItem["items"]) : [],
            approved_by: get("approved_by") ?? get("approved_by_user"),
            approvals: Array.isArray(rec.approvals) ? (rec.approvals as Approval[]) : undefined,
            approved_by_user: (get("approved_by_user") as User) ?? null,
            current_approval_level: (typeof currentLevel === "number" ? currentLevel : Number(currentLevel ?? NaN)) as number | undefined,
            required_approval_levels: (typeof requiredLevels === "number" ? requiredLevels : Number(requiredLevels ?? NaN)) as number | undefined,
            _raw: rec,
          } as RequestItem & { _raw?: unknown }
        })

        return normalized
      } catch (err) {
        console.error("fetchPending /purchases/requests/pending/ error:", err)
        toast.error("Failed to load pending requests")
        return []
      }
    },
  }
}

export default createStaffService