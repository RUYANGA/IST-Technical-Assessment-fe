"use client"
import Link from "next/link"
import React, { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import toast from "react-hot-toast"
import createStaffService from "@/components/approval/overview/services/staffService"
import type { RequestItem } from "@/components/approval/overview/services/staffService"

export default function RequestHeader({ request }: { request: RequestItem | null }) {
  const router = useRouter()
  const params = useParams()
  // typed view of params to avoid `any`
  const paramValues = params as Record<string, string | undefined>
  const [loading, setLoading] = useState(false)

  // hide action buttons when request is already approved
  const isApproved = String(request?.status ?? "").toUpperCase() === "APPROVED"

  async function handleUpdate(status: "APPROVED" | "REJECTED") {
    // prefer explicit request prop id, otherwise try URL params
    const id = request?.id ?? paramValues?.id ?? paramValues?.requestId
    if (!id) {
      console.warn("No request id (not passed as prop and not present in URL params)")
      toast.error("Request id not found")
      return
    }

    setLoading(true)
    try {
      const svc = createStaffService()
      const ok = await svc.updateRequest(id as number | string, { status })
      if (ok) {
        toast.success(status === "APPROVED" ? "Request approved" : "Request rejected")
        // navigate back to approval overview and include the approved id so overview can show it immediately
        const q = typeof id === "string" || typeof id === "number" ? `?justApproved=${encodeURIComponent(String(id))}` : ""
        router.push(`/dashboards/approval/${q}`)
      } else {
        toast.error("Action failed")
      }
    } catch (err) {
      console.error("update request error:", err)
      toast.error("Action failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold">Request details</h1>
      <div className="flex items-center gap-2">
        <Link href="/dashboards/approval" className="text-sm px-3 py-2 rounded border hover:bg-slate-50">
          Back
        </Link>

        {/* only show action buttons when we have an id and the request is not already approved */}
        {(request || paramValues?.id || paramValues?.requestId) && !isApproved ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleUpdate("REJECTED")
              }}
              disabled={loading}
              className="text-sm px-3 py-2 rounded bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-60"
            >
              Reject
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleUpdate("APPROVED")
              }}
              disabled={loading}
              className="text-sm px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              Approve
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}