import { useEffect, useState } from "react"
import type { RequestItem } from "@/components/staff/overwie/services/staffService"
import { createStaffService } from "@/components/staff/overwie/services/staffService"

const service = createStaffService()

export default function useRequestDetails(id?: string | null, svc = service) {
  const [request, setRequest] = useState<RequestItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let mounted = true
    setError(null)

    ;(async () => {
      // yield to the next tick to avoid calling setState synchronously inside the effect
      await Promise.resolve()
      if (!mounted) return
      setLoading(true)

      try {
        const res = await svc.fetchRequest(id)
        if (!mounted) return
        setRequest(res)
      } catch {
        if (!mounted) return
        setError("Failed to load request")
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [id, svc])

  return { request, loading, error, setRequest }
}