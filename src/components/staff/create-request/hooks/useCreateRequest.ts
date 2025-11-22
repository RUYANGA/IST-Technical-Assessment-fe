"use client"
import { useCallback, useMemo, useState } from "react"
import createRequestsService, { CreateRequestPayload } from "../services/requestsService"

export type Item = {
  id: string
  name: string
  quantity: number
  unit_price: string
}

// Single change: initialize requiredLevels to 1 and remove fetch-on-mount so user selection won't be overwritten
export function useCreateRequest(service = createRequestsService()) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [items, setItems] = useState<Item[]>(() => [{ id: String(Date.now()), name: "", quantity: 1, unit_price: "" }])

  // default to level 1 so the select is controlled and won't be reset after user picks another level
  const [requiredLevels, setRequiredLevels] = useState<number>(1)
  const [loadingDefaults] = useState<boolean>(false) // no remote fetch, so not loading
  const [submitting, setSubmitting] = useState(false)

  const addItem = useCallback(() => {
    setItems((s) => [...s, { id: String(Date.now()), name: "", quantity: 1, unit_price: "" }])
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((s) => s.filter((it) => it.id !== id))
  }, [])

  const updateItem = useCallback((id: string, patch: Partial<Item>) => {
    setItems((s) => s.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }, [])

  const totalAmountNumber = useMemo(() => {
    return items.reduce((acc, it) => {
      const q = Number(it.quantity) || 0
      const up = Number(String(it.unit_price).replace(/,/g, "")) || 0
      return acc + q * up
    }, 0)
  }, [items])

  const totalAmount = useMemo(() => totalAmountNumber.toFixed(2), [totalAmountNumber])

  const canSubmit = useMemo(() => {
    if (!title.trim()) return false
    if (!items.length) return false
    if (items.some((it) => !it.name.trim() || Number(it.quantity) <= 0)) return false
    return !submitting
  }, [title, items, submitting])

  const submit = useCallback(async () => {
    if (!canSubmit) throw new Error("Invalid request data")
    setSubmitting(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") ?? undefined : undefined
      const payload: CreateRequestPayload = {
        title: title.trim(),
        description: description.trim(),
        total_amount: totalAmount,
        required_approval_levels: requiredLevels ?? 1,
        items: items.map((it) => ({ name: it.name.trim(), quantity: Number(it.quantity), unit_price: String(it.unit_price) })),
      }
      const data = await service.create(payload, token)
      return data
    } finally {
      setSubmitting(false)
    }
  }, [title, description, items, requiredLevels, totalAmount, service, canSubmit])

  return {
    title, setTitle,
    description, setDescription,
    items, addItem, removeItem, updateItem,
    requiredLevels, setRequiredLevels, loadingDefaults,
    totalAmount, totalAmountNumber,
    submitting, canSubmit, submit,
  }
}

export default useCreateRequest