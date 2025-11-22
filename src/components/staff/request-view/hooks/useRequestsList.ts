import { useEffect, useState, useCallback } from "react"
import type { RequestItem } from "@/components/staff/overwie/services/staffService"
import { createStaffService } from "@/components/staff/overwie/services/staffService"

const defaultService = createStaffService()

export default function useRequestsList(service = defaultService) {
  const [items, setItems] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await service.fetchRecent()
      setItems(res)
    } catch {
      setError("Failed to load requests")
    } finally {
      setLoading(false)
    }
  }, [service])

  useEffect(() => {
    fetch()
  }, [fetch])

  const remove = useCallback(
    async (id: number | string) => {
      try {
        await service.deleteRequest(id)
        setItems((s) => s.filter((r) => String(r.id) !== String(id)))
        return true
      } catch {
        return false
      }
    },
    [service]
  )

  return { items, loading, error, refresh: fetch, deleteRequest: remove }
}