"use client"
import React, { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import toast from "react-hot-toast"
import { FilePlus, Plus, DollarSign, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import ItemRow from "./components/ItemRow"
import useEditRequest from "./hooks/useEditRequest"

export default function UpdateRequestPage({ id: propId }: { id?: string }) {
  const params = useParams() as { id?: string } | undefined
  const routeId = params?.id
  const id = propId ?? routeId ?? null

  const router = useRouter()

  // Only redirect when a param source is present but empty.
  useEffect(() => {
    // still hydrating / no info from either source yet
    if (propId === undefined && routeId === undefined) return
    const effective = propId ?? routeId
    if (!effective) {
      toast.error("Missing request id")
      router.push("/dashboards/staff/requests")
    }
  }, [propId, routeId, router])

  const {
    loading,
    loadingDefaults,
    submitting,
    canSubmit,
    loaded,
    title, setTitle,
    description, setDescription,
    items, addItem, removeItem, updateItem,
    requiredLevels, setRequiredLevels,
    totalAmount,
    requestStatus,
    loadError,
    submitUpdate,
  } = useEditRequest(id)

  useEffect(() => {
    if (loadError) toast.error(loadError)
  }, [loadError])

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (String(requestStatus ?? "").toUpperCase() === "APPROVED") {
      toast.error("Approved requests cannot be updated")
      return
    }
    const t = toast.loading("Saving changes…")
    try {
      const data = await submitUpdate()
      toast.success("Request updated", { id: t })
      const newId = data?.id ?? id
      if (newId) router.push(`/dashboards/staff/requests/${newId}`)
      else router.push("/dashboards/staff/requests")
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? "Update failed", { id: t })
    }
  }

  const isApproved = String(requestStatus ?? "").toUpperCase() === "APPROVED"

  if (loading) {
    return (
      <div className="md:ml-72">
        <main className="min-h-screen flex items-start justify-center py-6 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-4xl">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-slate-100 rounded w-1/3" />
              <div className="bg-white border rounded shadow-sm p-6 space-y-4">
                <div className="h-6 bg-slate-100 rounded w-2/3" />
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-36 bg-slate-100 rounded" />
                <div className="flex gap-3">
                  <div className="h-4 bg-slate-100 rounded w-24" />
                  <div className="h-4 bg-slate-100 rounded w-24" />
                  <div className="h-4 bg-slate-100 rounded w-24" />
                </div>
                <div className="h-8 bg-slate-100 rounded w-40 mt-2" />
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="md:ml-72">
      <main className="min-h-screen flex items-start justify-center py-6 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FilePlus className="w-6 h-6 text-sky-600" />
                <CardTitle className="m-0">{isApproved ? "View Purchase Request" : "Update Purchase Request"}</CardTitle>
              </div>
              <CardDescription>
                {isApproved ? "This request is approved and cannot be edited." : "Modify request details, items and save changes."}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={onSubmit} className="space-y-6">
                <Field>
                  <label className="text-sm">Title</label>
                  <Input value={title ?? ""} onChange={(e) => setTitle(e.target.value)} required disabled={isApproved} />
                </Field>

                <Field>
                  <label className="text-sm">Description</label>
                  <Textarea value={description ?? ""} onChange={(e) => setDescription(e.target.value)} rows={4} disabled={isApproved} />
                </Field>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">Items</div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-slate-500">Total</div>
                      <div className="text-sm font-medium flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-slate-500" /> <span>{totalAmount}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => { if (!isApproved) { addItem(); toast.success("Item added") } }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded bg-sky-50 text-sky-600 hover:bg-sky-100"
                        disabled={isApproved}
                      >
                        <Plus className="w-4 h-4" /> Add item
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {items.map((it) => (
                      <div key={(it.api_id ?? it.id) as string | number} className="p-3 border rounded">
                        <ItemRow
                          it={it}
                          onChange={(patch) => { if (!isApproved) updateItem(it.id, patch) }}
                          onRemove={() => { if (!isApproved) { removeItem(it.id); toast.success("Item removed") } }}
                          readOnly={isApproved}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <label htmlFor="required-levels" className="text-sm">Required approval levels</label>
                    <div className="mt-1">
                      {loadingDefaults ? (
                        <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                          <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                          Loading approval level…
                        </div>
                      ) : (
                        <select
                          id="required-levels"
                          value={String(requiredLevels ?? 1)}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRequiredLevels(Number.parseInt(e.target.value, 10))}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          disabled={isApproved}
                        >
                          <option value="1">Level 1</option>
                          <option value="2">Level 2</option>
                        </select>
                      )}
                    </div>
                    <FieldDescription>Choose Level 1 or Level 2.</FieldDescription>
                  </Field>

                  <Field>
                    <label className="text-sm">Total amount</label>
                    <Input readOnly value={totalAmount} className="text-right" />
                    <FieldDescription>Automatically calculated from items</FieldDescription>
                  </Field>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <Button
                    type="submit"
                    className="bg-sky-600"
                    disabled={!loaded || !canSubmit || submitting || isApproved || !id}
                  >
                    {submitting ? "Saving…" : isApproved ? "Cannot update" : "Save Changes"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.push("/dashboards/staff/requests")}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}