"use client"
import React from "react"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Item } from "../hooks/useCreateRequest"

export function ItemRow({ it, onChange, onRemove }: { it: Item, onChange: (patch: Partial<Item>) => void, onRemove: () => void }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-center">
      <div className="col-span-6">
        <Field>
          <FieldLabel className="text-xs">Item</FieldLabel>
          <Input value={it.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="Item name" />
        </Field>
      </div>

      <div className="col-span-3">
        <Field>
          <FieldLabel className="text-xs">Qty</FieldLabel>
          <Input type="number" min={0} value={String(it.quantity)} onChange={(e) => onChange({ quantity: Number(e.target.value || 0) })} />
        </Field>
      </div>

      <div className="col-span-3">
        <Field>
          <FieldLabel className="text-xs">Unit price</FieldLabel>
          <Input className="text-right" value={it.unit_price} onChange={(e) => onChange({ unit_price: e.target.value })} placeholder="0.00" />
        </Field>
      </div>

      <div className="col-span-12 flex justify-between items-center mt-1">
        <div className="text-sm text-slate-600">
          Subtotal: <span className="font-medium">{`Frw ${((Number(it.quantity || 0) * Number(String(it.unit_price).replace(/,/g, ""))) || 0).toLocaleString()}`}</span>
        </div>

        <button type="button" onClick={onRemove} className={cn("inline-flex items-center gap-2 px-2 py-1 rounded text-sm text-rose-600 hover:bg-rose-50")}>
          <Trash2 className="w-4 h-4" /> Remove
        </button>
      </div>
    </div>
  )
}

export default ItemRow