"use client"
import React, { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { setAuthToken } from "@/lib/api"

type Props = { children: React.ReactNode }

export default function AuthGuard({ children }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!pathname) return

    // Public routes that do not require authentication
    const publicPaths = ["/", "/login", "/signup"]

    // Allow Next internals, API routes and static assets to pass
    const isPublic =
      publicPaths.includes(pathname) ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/public") ||
      pathname.includes(".")

    // token stored in localStorage elsewhere in the app
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token && !isPublic) {
      // push to login when unauthenticated
      router.replace("/login")
    }

    // Ensure API client has the latest token (in case api was initialized earlier)
    if (token) {
      setAuthToken(token)
    }
  }, [pathname, router])

  return <>{children}</>
}
