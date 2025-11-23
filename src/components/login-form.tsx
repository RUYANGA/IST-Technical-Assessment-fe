"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import api, { setAuthToken } from "@/lib/api"
import { isAxiosError } from "axios"
import toast from "react-hot-toast"


export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await api.post("/auth/token/", { email, password })


      const token = res?.data?.access ?? res?.data?.refresh
      if (!token) throw new Error("No token received from server")
      setAuthToken(token)
      localStorage.setItem("token", token);

      const { data } = await api.get("/me/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },

      })

      if (data.role == "finance") {
        router.push("/dashboards/finance")
        toast.success("Login successfuly.")
      }else if (data.role == "approver1" || data.role == "approver2") {
        router.push("/dashboards/approval")
        toast.success("Login successfuly.")
      }else{
        router.push("/dashboards/staff")
        toast.success("Login successfuly.")
      }


    } catch (err: unknown) {
      // build a clear message string from the response
      let message = "Login failed"

      if (isAxiosError(err)) {
        const data = err.response?.data
        if (typeof data === "string") {
          message = data
        } else if (data && typeof data === "object") {
          message = (data.detail ?? data.message) as string ?? JSON.stringify(data)
        } else {
          message = err.message ?? message
        }
      } else if (err instanceof Error) {
        message = err.message
      }

      // show a user-friendly toast
      toast.error(String(message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline text-indigo-500"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <Field>
                <Button className="bg-indigo-500 text-2xl hover:bg-indigo-700" type="submit" disabled={loading}>
                  {loading ? "Logging in…" : "Login"}
                </Button>
                <Button
                  variant="outline"
                  className="bg-amber-100"
                  type="button"
                  onClick={() => toast("Not implemented")}
                >
                  Login with Google
                </Button>
                <FieldDescription className="text-center text-blue-900">
                  Don&apos;t have an account? <a href="/signup">Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
