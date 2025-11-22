import React from "react"
import type { RequestItem } from "@/components/staff/overwie/services/staffService"

export default function ApprovalsList({ approvals }: { approvals?: RequestItem["approvals"] }) {
  if (!approvals || approvals.length === 0) return null

  const getApproverName = (appr: unknown) => {
    if (typeof appr === "object" && appr !== null && "full_name" in appr) {
      const maybe = (appr as { full_name?: string }).full_name
      return maybe ?? "—"
    }
    return String(appr ?? "—")
  }

  return (
    <div>
      <div className="text-sm font-medium mb-2">Approvals</div>
      <ul className="space-y-2 text-sm text-slate-700">
        {approvals.map((a, i) => (
          <li key={i} className="flex items-center justify-between">
            <div>
              <div className="font-medium">{getApproverName(a.approver)}</div>
              <div className="text-xs text-slate-500">Level {a.level ?? "—"}</div>
            </div>
            <div className="text-xs text-slate-500">{a.approved_at ? new Date(a.approved_at).toLocaleString() : "—"}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}