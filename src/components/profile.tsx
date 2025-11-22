"use client"
import React, { JSX, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  Mail,
  Phone,
  Calendar,
  User,
  Edit2,
  ArrowLeft,
  Download,
  LogOut,
  Clipboard
} from "lucide-react"

type Role = "admin" | "doctor" | "user"
type CurrentUser = {
  id?: string
  full_name?: string
  email?: string
  role?: Role
  phone?: string
  bio?: string
  avatar_url?: string
  stats?: {
    appointments?: number
    patients?: number
    prescriptions?: number
  }
}

export default function ProfilePage(): JSX.Element {
  const router = useRouter()
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
        if (!token) {
          if (mounted) {
            setError("Not authenticated")
            setUser(null)
          }
          return
        }

        const res = await api.get<CurrentUser>("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!mounted) return
        setUser(res.data ?? null)
        setError(null)
      } catch (err) {
        if (!mounted) return
        setError("Failed to load profile")
        setUser(null)
        
        console.error("Profile load error:", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const displayName = user?.full_name ?? user?.email?.split("@")[0] ?? "User"
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  function dashboardPath(role?: Role) {
    if (role === "admin") return "/dashboard/admin"
    if (role === "doctor") return "/dashboard/doctor"
    return "/dashboard/user"
  }

  function goBack() {
    router.push(dashboardPath(user?.role))
  }

  function onEdit() {
    router.push("/profile/edit")
  }

  function onChangePassword() {
    router.push("/profile/change-password")
  }

  function exportProfile() {
    if (!user) return
    const blob = new Blob([JSON.stringify(user, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${displayName.replace(/\s+/g, "_")}_profile.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setInfo("Profile exported")
    setTimeout(() => setInfo(null), 3000)
  }

  async function copyEmail() {
    if (!user?.email) return
    try {
      await navigator.clipboard.writeText(user.email)
      setInfo("Email copied")
      setTimeout(() => setInfo(null), 2000)
    } catch {
      setInfo("Copy failed")
      setTimeout(() => setInfo(null), 2000)
    }
  }

  function handleLogout() {
    // remove token and navigate to login
    if (typeof window !== "undefined") localStorage.removeItem("token")
    router.push("/login")
  }

  // full page skeleton
  if (loading) {
    return (
      <div className={cn("w-full max-w-6xl mx-auto p-4 md:p-6")}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-md bg-slate-100 animate-pulse" />
          <div className="space-y-2 w-48">
            <div className="h-4 bg-slate-100 rounded animate-pulse" />
            <div className="h-3 bg-slate-100 rounded w-3/4 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="col-span-1 bg-white border rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-slate-100 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse"></div>
                <div className="h-6 bg-slate-100 rounded w-2/3 animate-pulse"></div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3 bg-slate-100 rounded w-full animate-pulse"></div>
              <div className="h-3 bg-slate-100 rounded w-5/6 animate-pulse"></div>
            </div>
          </section>

          <div className="lg:col-span-2 flex flex-col gap-6">
            <section className="bg-white border rounded-lg p-4">
              <div className="h-4 bg-slate-100 rounded w-1/4 animate-pulse mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse"></div>
                <div className="h-4 bg-slate-100 rounded w-2/3 animate-pulse"></div>
              </div>
            </section>

            <section className="bg-white border rounded-lg p-4">
              <div className="h-4 bg-slate-100 rounded w-1/4 animate-pulse mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-slate-100 rounded w-2/3 animate-pulse"></div>
              </div>
            </section>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full max-w-6xl mx-auto p-4 md:p-6")}>
      {/* error banner (uses `error` so linter warning goes away) */}
      {error && (
        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 flex items-center justify-between">
          <div>{error}</div>
          <button
            aria-label="Dismiss error"
            onClick={() => setError(null)}
            className="ml-4 text-rose-700 hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            aria-label="Back to dashboard"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100 border"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{displayName}</h1>
            <p className="text-sm text-slate-500">{user?.role ?? "user"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {info && <div className="text-sm text-sky-600 mr-2">{info}</div>}
          <button onClick={exportProfile} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-slate-50 border hover:bg-slate-100 text-sm">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={copyEmail} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-slate-50 border hover:bg-slate-100 text-sm">
            <Clipboard className="w-4 h-4" /> Copy email
          </button>
          <button onClick={handleLogout} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: profile card */}
        <section className="col-span-1 bg-white border rounded-lg p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-semibold text-slate-700 overflow-hidden">
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt={`${displayName} avatar`} className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900">{displayName}</h2>
              <p className="text-sm text-slate-500">{user?.email ?? "—"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={onEdit} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-slate-50">
                  <Edit2 className="w-4 h-4" /> Edit profile
                </button>
                <button onClick={onChangePassword} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-slate-50">
                  Change password
                </button>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-800 mb-2">About</h4>
            <p className="text-sm text-slate-600">{user?.bio ?? "No bio provided."}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-2">
            <div className="text-center">
              <div className="text-xs text-slate-500">Appointments</div>
              <div className="text-lg font-semibold text-slate-900">{user?.stats?.appointments ?? 0}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-500">Patients</div>
              <div className="text-lg font-semibold text-slate-900">{user?.stats?.patients ?? 0}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-500">Prescriptions</div>
              <div className="text-lg font-semibold text-slate-900">{user?.stats?.prescriptions ?? 0}</div>
            </div>
          </div>
        </section>

        {/* Right: details & activity */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <section className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">Contact & details</h3>
              <div className="text-xs text-slate-500">Last updated: —</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-slate-500 mt-1" />
                <div>
                  <div className="text-xs text-slate-500">Email</div>
                  <div className="text-sm font-medium text-slate-900">{user?.email ?? "—"}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-slate-500 mt-1" />
                <div>
                  <div className="text-xs text-slate-500">Phone</div>
                  <div className="text-sm font-medium text-slate-900">{user?.phone ?? "—"}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-slate-500 mt-1" />
                <div>
                  <div className="text-xs text-slate-500">Role</div>
                  <div className="text-sm font-medium text-slate-900">{user?.role ?? "user"}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-slate-500 mt-1" />
                <div>
                  <div className="text-xs text-slate-500">Member since</div>
                  <div className="text-sm font-medium text-slate-900">Account data unavailable</div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">Recent activity</h3>
              <span className="text-xs text-slate-500">Overview of recent actions</span>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">Logged in</div>
                  <div className="text-xs text-slate-500">Just now</div>
                </div>
                <div className="text-xs text-slate-400">—</div>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">Viewed appointments</div>
                  <div className="text-xs text-slate-500">Today</div>
                </div>
                <div className="text-xs text-slate-400">—</div>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">Profile updated</div>
                  <div className="text-xs text-slate-500">—</div>
                </div>
                <div className="text-xs text-slate-400">—</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}