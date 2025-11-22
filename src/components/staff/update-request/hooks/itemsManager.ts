import { useState } from "react"
import type { Item } from "./types"

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// Single responsibility: manages local items state.
// Do NOT reset state from an incoming transient array each render.
export function useItemsManager(initial?: Item[]) {
  const [items, setItems] = useState<Item[]>(initial ?? [])

  function addItem() {
    setItems((s) => [...s, { id: makeId(), name: "", description: "", quantity: 1, unit_price: 0 }])
  }

  function updateItem(itemId: string, patch: Partial<Item>) {
    setItems((s) => s.map((it) => (it.id === itemId ? { ...it, ...patch } : it)))
  }

  function removeItem(itemId: string) {
    setItems((s) => s.filter((it) => it.id !== itemId))
  }

  return { items, setItems, addItem, updateItem, removeItem }
}