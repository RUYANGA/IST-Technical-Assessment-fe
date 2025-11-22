import React from "react"
import type { RequestItem } from "@/components/staff/overwie/services/staffService"

export default function ItemsList({ items }: { items?: RequestItem["items"] }) {
  if (!items || items.length === 0) return null
  return (
    <div>
      <div className="text-sm font-medium mb-2">Items</div>
      <ul className="divide-y">
        {items.map((it, i) => (
          <li key={i} className="py-2 flex justify-between text-sm text-slate-700">
            <div>{it.name ?? "Item"}</div>
            <div className="text-slate-600">{String(it.quantity ?? "—")} × {String(it.unit_price ?? "—")}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}