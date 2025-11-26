"use client"
import React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Mail, User, ArrowLeft, LogOut, Clipboard, Edit2, Key } from "lucide-react"
import toast from "react-hot-toast"

type Role = "staff" | "finance" | "approver1" | "approver2"
type CurrentUser = {
  id: number
  email: string
  first_name: string
  last_name: string
  role: Role
}

// NOTE: this file uses a static `user` object for demo purposes.
// Replace with real user data / hook when integrating auth.
const user: CurrentUser = {
  id: 2,
  email: "ruyangamerci30@gmail.com",
  first_name: "Merci",
  last_name: "KAGABO",
  role: "finance",
}

export default function ProfilePage() {
  const router = useRouter()
  const displayName = `${user.first_name} ${user.last_name}`
  const initials = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()

  function dashboardPath(role: Role): string {
    switch (role) {
      case "staff":
        return "/dashboards/staff"
      case "finance":
        return "/dashboards/finance"
      case "approver1":
      case "approver2":
        return "/dashboards/approval"
      default:
        const _exhaustiveCheck: never = role
        throw new Error(`Unhandled role: ${_exhaustiveCheck}`)
    }
  }

  function goBack() {
    router.push(dashboardPath(user.role))
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(user.email)
      toast.success("Email copied to clipboard")
    } catch {
      toast.error("Unable to copy email")
    }
  }

  function handleLogout() {
    if (typeof window !== "undefined") localStorage.removeItem("token")
    router.push("/login")
  }

  function goEdit() {
    router.push("/profile/edit")
  }

  function changePassword() {
    router.push("/profile/change-password")
  }

  return (
    <div className={cn("w-full max-w-6xl mx-auto p-4 md:p-6")}>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={goBack}
              aria-label="Back to dashboard"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100 border"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-2xl font-semibold text-slate-800 ring-1 ring-slate-200 overflow-hidden">
                <span>{initials}</span>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">{displayName}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="px-2 py-1 rounded bg-slate-100 text-xs font-medium text-slate-700">{user.role.toUpperCase()}</span>
                  <span className="text-sm text-slate-500">Member since <strong className="text-slate-700">2023</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={goEdit} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700 text-sm">
              <Edit2 className="w-4 h-4" /> Edit Profile
            </button>
            <button onClick={changePassword} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-slate-50 border hover:bg-slate-100 text-sm">
              <Key className="w-4 h-4" /> Change password
            </button>
            <button onClick={handleLogout} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: profile card */}
        <section className="col-span-1 bg-white border rounded-lg p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-sky-50 to-sky-100 flex items-center justify-center text-3xl font-semibold text-slate-900 ring-1 ring-slate-200 overflow-hidden">
              <span>{initials}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={copyEmail} className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-50 border hover:bg-slate-100 text-sm">
                  <Clipboard className="w-4 h-4" /> Copy email
                </button>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-800 mb-2">About</h4>
            <p className="text-sm text-slate-600">No bio provided. Update your profile to let your colleagues know more about you.</p>
          </div>
        </section>

        {/* Right: details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <section className="bg-white border rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-slate-500 mt-1" />
                <div>
                  <div className="text-xs text-slate-500">Email</div>
                  <div className="text-sm font-medium text-slate-900">{user.email}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-slate-500 mt-1" />
                <div>
                  <div className="text-xs text-slate-500">Role</div>
                  <div className="text-sm font-medium text-slate-900">{user.role.toUpperCase()}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded text-center">
                <div className="text-xs text-slate-500">Requests</div>
                <div className="text-lg font-semibold text-slate-900">—</div>
              </div>
              <div className="p-3 bg-slate-50 rounded text-center">
                <div className="text-xs text-slate-500">Approvals</div>
                <div className="text-lg font-semibold text-slate-900">—</div>
              </div>
              <div className="p-3 bg-slate-50 rounded text-center">
                <div className="text-xs text-slate-500">Orders</div>
                <div className="text-lg font-semibold text-slate-900">—</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}