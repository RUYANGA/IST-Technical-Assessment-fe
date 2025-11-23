import React from "react"

type DashboardCardProps = {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}

export function DashboardCard({ icon, label, value }: DashboardCardProps) {
  return (
    <div className="p-4 sm:p-6 md:p-8 bg-white rounded-lg shadow-md flex items-center gap-3 sm:gap-4">
      <div className="p-2 sm:p-3 md:p-4 rounded-lg bg-slate-100">{icon}</div>
      <div className="flex-1">
        <div className="text-xs sm:text-sm md:text-base text-slate-500">{label}</div>
        <div className="text-xl sm:text-2xl md:text-3xl font-semibold">{value}</div>
      </div>
    </div>
  )
}