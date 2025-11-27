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
      : effectiveRole === "approver1"
      ? "Approver Level 1"
      : effectiveRole === "approver2"
      ? "Approver Level 2"
      : effectiveRole === "staff"
      ? "Staff Dashboard"
      : "My Dashboard"

  const computedDescription =
    effectiveRole === "finance"
      ? "Procure‑to‑Pay: billing, invoices & reconciliations"
      : effectiveRole === "approver1"
      ? "Level 1 approver manage and approve initial requests"
      : effectiveRole === "approver2"
      ? "Level 2 approver review and finalize approvals"
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

  // Short title for small screens: strip extra parenthetical/annotations
  const shortTitle = (() => {
    const src = title ?? (loading ? "" : computedTitle) ?? ""
    if (!src) return ""
    // prefer the segment before any punctuation like ( or : or -
    let base = src.split(/[\(\:\-–—]/)[0].trim()
    // if it contains the word 'Dashboard' try to return a compact form
    if (/dashboard/i.test(base)) {
      const parts = base.split(/\s+/)
      // e.g. "Finance Dashboard" -> "Finance"
      if (parts.length > 1) return parts[0]
    }
    if (base.length > 20) return base.slice(0, 20).trim() + "..."
    return base
  })()

  return (
    <header className="sticky top-0 z-20 bg-white border-b transition-all md:ml-72">
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto px-3 md:px-4 py-2">
        <div className="flex-1 min-w-0 flex items-center gap-3">
        <button onClick={onToggleSidebar} className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-slate-700 hover:bg-slate-100" aria-label="Toggle sidebar">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          <h1 className="text-base font-semibold text-slate-900 min-w-0">
            <span
              className="hidden sm:inline block truncate max-w-[28ch]"
              title={title ?? (loading ? "" : computedTitle)}
              aria-label={title ?? (loading ? "" : computedTitle)}
            >
              {title ?? (loading ? "" : computedTitle)}
            </span>
            <span
              className="sm:hidden block truncate max-w-[14ch]"
              title={title ?? (loading ? "" : computedTitle)}
              aria-label={title ?? (loading ? "" : computedTitle)}
            >
              {shortTitle || (title ?? (loading ? "" : computedTitle))}
            </span>
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            {loading ? "" : computedDescription}
          </p>
        </div>
        </div>

        <div className="flex items-center gap-3 ml-3">
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-sm font-medium">{displayName}</span>
          <small className="text-xs text-slate-500">{displayrole}</small>
        </div>
        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-700 text-sm">
          {displayName ? displayName.split(" ").map((s) => s[0]).slice(0, 2).join("") : ""}
        </div>
        </div>
      </div>
    </header>
  )
}