"use client"
import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import api, { setAuthToken } from "@/lib/api"
import type { LucideIcon } from "lucide-react"
import { Users, ClipboardList, BarChart2, ShoppingCart, FileText, FilePlus } from "lucide-react"
import { LogoutButton } from "../logout"

type Role = "finance" | "approver1" |"approver2" |"staff"
type SidebarProps = {
  isOpen?: boolean
  onClose?: () => void
  role?: Role
}

type CurrentUser = {
  id?: string
  first_name?: string
  last_name?: string
  email?: string
  role?: string
}

const roleNav: Record<Role, Array<{ href: string; label: string; icon: LucideIcon }>> = {
  // finance: procure-to-pay focused navigation
  finance: [
    { href: "/dashboards/finance", label: "Overview", icon: BarChart2 },
    { href: "/dashboards/finance/requests", label: "Requests", icon: ClipboardList },
    { href: "/dashboards/finance/order", label: "Purchase Orders", icon: ShoppingCart },
  ],

  // approver1 and approver2 share the same approval workflow navigation
  approver1: [
     { href: "/dashboards/approval", label: "Overview", icon: BarChart2 },
    { href: "/dashboards/approval/pending", label: "Pending Requests", icon: ClipboardList },
    { href: "/dashboards/approval/my-approvals", label: "My Approvals", icon: Users },
    { href: "/dashboards/approval/po", label: "Purchase Orders", icon: ShoppingCart },
  ],
  approver2: [
    { href: "/dashboards/approval", label: "Overview", icon: BarChart2 },
    { href: "/dashboards/approval/pending", label: "Pending Requests", icon: ClipboardList },
    { href: "/dashboards/approval/my-approvals", label: "My Approvals", icon: Users },
    { href: "/dashboards/approval/po", label: "Purchase Orders", icon: ShoppingCart },
  ],

  // staff: create & track purchase requests, submit receipts
  staff: [
     { href: "/dashboards/staff", label: "Overview", icon: BarChart2 },
    { href: "/dashboards/staff/new-request", label: "Create Request", icon: FilePlus },
    { href: "/dashboards/staff/requests", label: "My Requests", icon: ClipboardList },
    
    { href: "/dashboards/staff/history", label: "Request History", icon: FileText },
  ],
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose, role = "approver1" }) => {
   const pathname = usePathname() || "/"
   const router = useRouter()

   const [user, setUser] = useState<CurrentUser | null>(null)
   const [loadingUser, setLoadingUser] = useState<boolean>(true)

   useEffect(() => {
     let mounted = true
     async function loadUser() {
       setLoadingUser(true)
       try {
         const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
         if (!token) {
           if (mounted) setUser(null)
           return
         }

         const res = await api.get<CurrentUser>("/me/", {
           headers: {
             Authorization: `Bearer ${token}`,
           },
         })

         if (!mounted) return
         setUser(res.data ?? null)
       } catch (err) {
         console.error("Failed to load current user", err)
         if (mounted) setUser(null)
       } finally {
         if (mounted) setLoadingUser(false)
       }
     }

     loadUser()
     return () => {
       mounted = false
     }
   }, [])

   function handleLogout() {
     setAuthToken(null)
     if (typeof window !== "undefined") localStorage.removeItem("token")
     router.push("/login")
   }

   // Map backend role strings to our UI roles.
   // Treat approver1 and approver2 the same (map -> "approver1"), keep staff separate
   const backendRole = user?.role ?? role
   const mappedRole: Role =
     backendRole === "finance" ? "finance" :
     backendRole === "approver1" || backendRole === "approver2" ? "approver1" :
     backendRole === "staff" ? "staff" :
     (role as Role)

  // while loadingUser is true, prefer the prop `role` to avoid showing incorrect text
  const effectiveRole: Role = loadingUser ? (role as Role) : mappedRole

  const nav = roleNav[effectiveRole]

  const isMobile = typeof window !== "undefined" ? window.innerWidth < 768 : false
  const ariaHidden = (!isOpen && isMobile) ? "true" : "false"

  function closeOnNavigate() {
    if (onClose) onClose()
  }

  // show "First Last" if available, otherwise email local-part, otherwise blank
  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    (user?.email ? user.email.split("@")[0] : " ")

  return (
    <aside
      className={cn(
        "bg-white border-r shadow-sm flex flex-col z-40",
        // always fixed to the viewport; on medium+ screens keep visible (md:translate-x-0)
        "fixed top-0 left-0 h-full w-72 min-h-screen transform transition-transform duration-200 ease-in-out",
        // mobile: respect isOpen prop; desktop (md+) stays visible
        isOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0"
      )}
      aria-hidden={ariaHidden}
      role="navigation"
    >
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3" onClick={closeOnNavigate}>
          <div className="w-10 h-10 rounded-md bg-sky-600 flex items-center justify-center text-white font-bold">
            {displayName.split(" ").map((s) => s[0]).slice(0, 2).join("") || "ML"}
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-900">MedLink</div>
          </div>
        </Link>

        <button onClick={onClose} aria-label="Close sidebar" className="md:hidden ml-2 rounded p-1 text-slate-600 hover:bg-slate-100">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="px-2 py-4 flex-1 overflow-y-auto" aria-label={`${effectiveRole} sidebar`}>
        {/* show skeleton while fetching user */}
        {loadingUser ? (
          <div className="px-3">
            <div className="animate-pulse space-y-2">
              <div className="h-3 bg-slate-100 rounded w-5/6"></div>
              <div className="h-3 bg-slate-100 rounded w-2/3"></div>
              <div className="h-3 bg-slate-100 rounded w-3/4"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
              <div className="h-3 bg-slate-100 rounded w-4/6"></div>
            </div>
          </div>
        ) : (
          <ul className="space-y-1">
            {nav.map((n) => {
              const Icon = n.icon
              // only mark active when the pathname exactly equals the link href
              const active = pathname === n.href
               return (
                 <li key={n.href}>
                   <Link
                     href={n.href}
                     onClick={closeOnNavigate}
                     aria-current={active ? "page" : undefined}
                     className={cn(
                       "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                       active
                         ? "bg-sky-50 text-sky-700 ring-1 ring-sky-100"
                         : "text-slate-700 hover:bg-slate-100 hover:text-sky-700"
                     )}
                   >
                     <Icon
                       className={cn(
                         "w-5 h-5 flex-none transition-colors",
                         active ? "text-sky-600" : "text-slate-400 group-hover:text-sky-600"
                       )}
                       aria-hidden
                     />
                     <span className="flex-1">{n.label}</span>
                   </Link>
                 </li>
               )
             })}
           </ul>
        )}
      </nav>

      <div className="px-4 py-4 border-t">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700">
            {displayName.split(" ").map((s) => s[0]).slice(0, 2).join("")}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-slate-900">{displayName}</div>
            <div className="text-xs text-slate-500">{user?.email ?? ""}</div>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Link href="/profile" onClick={closeOnNavigate} className="flex-1 rounded-md border px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-center">Profile</Link>
          <LogoutButton handleLogout={handleLogout} />
        </div>
      </div>
    </aside>
  )
}

export default Sidebar