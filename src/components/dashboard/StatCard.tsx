"use client"
import React from "react"

export default function StatCard({
  title,
  value,
  delta,
}: {
  title: string
  value: string | number
  delta?: string
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 flex items-baseline gap-3">
        <div className="text-2xl font-semibold text-slate-900">{value}</div>
        {delta && <div className="text-sm text-green-600">{delta}</div>}
      </div>
    </div>
  )
}