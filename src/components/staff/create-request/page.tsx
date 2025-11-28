"use client"
import React from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { FilePlus, Plus, DollarSign, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import useCreateRequest from "./hooks/useCreateRequest"
import ItemRow from "./components/ItemRow"

export default function CreateRequestPage() {
  const router = useRouter()
  const {
    title, setTitle,
    description, setDescription,
    items, addItem, removeItem, updateItem,
    requiredLevels, setRequiredLevels, loadingDefaults,
    totalAmount, submitting, canSubmit, submit,
  } = useCreateRequest()

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    const toastId = toast.loading("Submitting request…")
    try {
      const data = await submit()
      toast.success("Request created", { id: toastId })
      const id = data?.id
      if (id) router.push(`/dashboards/staff/requests/${id}`)
      else router.push("/dashboards/staff/requests")
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? "Create request failed", { id: toastId })
    }
  }

  return (
    // keep responsive spacing and center card within available content area;
    // on md+ account for fixed sidebar using md:ml-64
    <div className="md:ml-64">
      <main className="min-h-screen flex items-start md:items-start justify-center py-6 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FilePlus className="w-6 h-6 text-sky-600" />
                <CardTitle className="m-0">Create Purchase Request</CardTitle>
              </div>
              <CardDescription>
                Add request details, items and submit for approval. Approval level fetched from server.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={onSubmit} className="space-y-6">
                <Field>
                  <label className="text-sm">Title</label>
                  <Input
                    value={title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                    required
                  />
                </Field>

                <Field>
                  <label className="text-sm">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                    rows={4}
                  />
                </Field>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">Items</div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-slate-500">Total</div>
                      <div className="text-sm font-medium flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-slate-500" /> <span>{totalAmount}Frw</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          addItem()
                          toast.success("Item added")
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded bg-sky-50 text-sky-600 hover:bg-sky-100"
                      >
                        <Plus className="w-4 h-4" /> Add item
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {items.map((it) => (
                      <div key={it.id} className="p-3 border rounded">
                        <ItemRow it={it} onChange={(patch) => updateItem(it.id, patch)} onRemove={() => { removeItem(it.id); toast.success("Item removed") }} />
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
                    disabled={!canSubmit || submitting}
                    onClick={() => {
                      /* ensure form submit triggers toast via onSubmit */
                    }}
                  >
                    {submitting ? "Submitting…" : "Create Request"}
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