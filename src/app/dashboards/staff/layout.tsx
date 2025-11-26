"use client"
import React, { useState } from "react"
import Sidebar from "@/components/dashboard/Sidebar"
import Header from "@/components/dashboard/Header"

export default function DashboardLayout({
  children,
  title,
  role = "finance",
}: {
  children: React.ReactNode
  title?: string
  role?: "finance" | "approver1" | "approver2" | "staff"
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar: static on md+, off-canvas on small screens */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} role={role} />

      {/* Mobile overlay when sidebar is open */}
      {isSidebarOpen && (
        <div
          aria-hidden
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} onToggleSidebar={() => setSidebarOpen((s) => !s)} role={role} />
        <main className="p-4 md:p-6 max-w-7xl w-full mx-auto md:ml-72">{children}</main>
      </div>
    </div>
  )
}