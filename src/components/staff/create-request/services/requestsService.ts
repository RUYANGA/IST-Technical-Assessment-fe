// Single Responsibility: this module only knows how to talk to the purchases requests API.
import api from "@/lib/api"
import type { AxiosInstance } from "axios"

export type CreateRequestPayload = {
  title: string
  description?: string
  total_amount: string
  required_approval_levels: number
  items: Array<{ name: string; quantity: number; unit_price: string }>
}

export type DefaultsResponse = {
  required_approval_levels?: number
  available_levels?: number[]
}

export function createRequestsService(client: AxiosInstance = api) {
  return {
    // No network fetch — provide safe defaults and available levels (1 and 2)
    async fetchDefaults(): Promise<DefaultsResponse> {
      return {
        required_approval_levels: 1,
        available_levels: [1, 2],
      }
    },

    async create(payload: CreateRequestPayload, token?: string) {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await client.post("/purchases/requests/", payload, { headers })
      return res.data
    },
  }
}

export default createRequestsService