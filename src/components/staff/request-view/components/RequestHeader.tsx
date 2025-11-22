import Link from "next/link"
import React from "react"
import type { RequestItem } from "@/components/staff/overwie/services/staffService"

export default function RequestHeader({ request }: { request: RequestItem | null }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold">Request details</h1>
      <div className="flex items-center gap-2">
        <Link href="/dashboards/staff" className="text-sm px-3 py-2 rounded border hover:bg-slate-50">
          Back
        </Link>
        {request && (
          <Link
            href={`/dashboards/staff/requests/${request.id}/edit`}
            className="text-sm px-3 py-2 rounded bg-sky-600 text-white hover:bg-sky-700"
          >
            Edit
          </Link>
        )}
      </div>
    </div>
  )
}