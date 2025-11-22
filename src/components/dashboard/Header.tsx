"use client"
import React, { useEffect, useState } from "react"
import api from "@/lib/api"

type Role = "finance" | "approver1" | "approver2"|"staff"
type CurrentUser = {
  first_name?: string
  last_name?: string
  email?: string
  role?: Role | string
}

export default function Header({
  title,
  onToggleSidebar,
  role = "approver1",
}: {
  title?: string
  onToggleSidebar?: () => void
  role?: Role
}) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        if (!token) {
          if (mounted) setUser(null)
          return
        }
        const res = await api.get<CurrentUser>("/me/", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!mounted) return
        setUser(res.data ?? null)
      } catch (err) {
        if (mounted) setUser(null)
        console.error("Failed to fetch current user", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const roleFromServer = (user?.role as string) ?? undefined

  // while loading don't fall back to the default role prop — avoid showing ADMIN during fetch
  const effectiveRole = loading ? undefined : (roleFromServer ?? role)

  const computedTitle =
    effectiveRole === "finance"
      ? "Finance Dashboard"
      : effectiveRole === "approver1" || effectiveRole === "approver2"
      ? "Approver Dashboard"
      : effectiveRole === "staff"? "Staff Dashboard" : "My Dashboard"

  const computedDescription =
    effectiveRole === "finance"
      ? "Procure‑to‑Pay: billing, invoices & reconciliations"
      : effectiveRole === "approver1" || effectiveRole === "approver2"
      ? "Review & approve purchase requests"
      : effectiveRole === "staff"
      ? "Create, track and submit purchase requests"
      : "Overview"
  const displayName = loading
    ? ""
    : [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
      (user?.email ? user.email.split("@")[0] : " ")

  const displayrole = loading
    ? ""
    : roleFromServer === "approver1" || roleFromServer === "approver2"
    ? "APPROVER"
    : roleFromServer === "finance"
    ? "FINANCE"
    : String(roleFromServer ?? "").toUpperCase()

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 bg-white border-b sticky top-0 z-20 transition-all md:ml-72">
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-slate-700 hover:bg-slate-100" aria-label="Toggle sidebar">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            {title ?? (loading ? "" : computedTitle)}
          </h1>
          <p className="text-sm text-slate-500 hidden sm:block">
            {loading ? "" : computedDescription}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-sm font-medium">{displayName}</span>
          <small className="text-xs text-slate-500">{displayrole}</small>
        </div>
        <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-slate-700">
          {displayName ? displayName.split(" ").map((s) => s[0]).slice(0, 2).join("") : ""}
        </div>
      </div>
    </header>
  )
}