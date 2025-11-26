"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import api, { setAuthToken } from "@/lib/api";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

const DEMO_CREDENTIALS: Record<string, { email: string; password: string } | null> = {
  finance: { email: "ruyangam15@gmail.com", password: "1234" },
  approver2: { email: "ruyangamerci30@gmail.com", password: "1234" },
  approver1: { email: "igacode15@gmail.com", password: "1234" },
  staff: { email: "marieireneimanishimwe@gmail.com", password: "1234" },
  clear: null,
};

const ROLE_REDIRECT: Record<string, string> = {
  finance: "/dashboards/finance",
  approver1: "/dashboards/approval",
  approver2: "/dashboards/approval",
  staff: "/dashboards/staff",
};

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function applyDemo(role: string) {
    const creds = DEMO_CREDENTIALS[role];
    if (!creds) {
      setEmail("");
      setPassword("");
      toast("Demo credentials cleared");
      return;
    }
    setEmail(creds.email);
    setPassword(creds.password);
    toast.success(`Applied demo credentials: ${role}`);
  }

  function extractErrorMessage(err: unknown): string {
    if (isAxiosError(err)) {
      const data = err.response?.data;
      if (typeof data === "string") return data;
      if (data && typeof data === "object") {
        return (data.detail ?? data.message) as string ?? JSON.stringify(data);
      }
      return err.message ?? "Request failed";
    }
    if (err instanceof Error) return err.message;
    return "An unknown error occurred";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const res = await api.post("/auth/token/", { email, password });
      const token = res?.data?.access ?? res?.data?.refresh;
      if (!token) throw new Error("Authentication token not provided by server");

      // set token in client helper (persists to localStorage)
      setAuthToken(token);

      const meRes = await api.get("/me/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const role = String(meRes?.data?.role ?? "").toLowerCase();

      const destination = ROLE_REDIRECT[role];
      if (destination) {
        toast.success("Login successful");
        // replace prevents back-navigation to login
        router.replace(destination);
      } else {
        toast("Login succeeded but your role is not permitted here");
      }
    } catch (err: unknown) {
      const message = extractErrorMessage(err);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Enter your credentials to access your MedLink dashboard.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} aria-describedby="login-desc">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="demo">Demo role</FieldLabel>
                <div className="flex gap-2">
                  <select
                    id="demo"
                    name="demo"
                    aria-label="Choose demo role"
                    className="rounded border px-3 py-2 flex-1"
                    onChange={(e) => applyDemo(e.target.value)}
                    defaultValue=""
                  >
                    <option value="">Choose demo role…</option>
                    <option value="finance">Finance Role</option>
                    <option value="staff">Staff Role</option>
                    <option value="approver1">Approver Level 1 Role</option>
                    <option value="approver2">Approver Level 2 Role</option>
                    <option value="clear">Clear</option>
                  </select>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEmail("");
                      setPassword("");
                      toast("Fields cleared");
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email address</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline text-indigo-600"
                  >
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </Field>

              <Field>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    className="bg-indigo-600 text-white hover:bg-indigo-700 flex-1"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="animate-spin w-5 h-5" />
                        Signing in…
                      </span>
                    ) : (
                      "Sign in"
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="bg-amber-50"
                    type="button"
                    onClick={() => toast("Social login is not implemented")}
                  >
                    Sign in with Google
                  </Button>
                </div>

                {/* <FieldDescription id="login-desc" className="text-center text-sm text-slate-600 mt-3">
                  Don&apos;t have an account?{" "}
                  <a href="/signup" className="text-indigo-600 underline">
                    Create one
                  </a>
                </FieldDescription> */}
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
