import React, { useState } from "react"
import { Trash2 } from "lucide-react"
import { ConfirmDialog } from "./confirm-dialog"

export function DeleteButton({
  handleDelete,
  disabled,
  title,
  description,
  buttonLabel = "Delete",
}: {
  handleDelete: () => Promise<void> | void
  disabled?: boolean
  title?: string
  description?: string
  buttonLabel?: string
}) {
  const [localDisabled, setLocalDisabled] = useState<boolean>(false)

  return (
    <ConfirmDialog
      trigger={
        <button
          type="button"
          disabled={disabled || localDisabled}
          className={`px-3 py-2 text-sm text-rose-600 hover:bg-slate-50 rounded ${disabled || localDisabled ? "opacity-50" : ""}`}
          aria-disabled={disabled || localDisabled}
        >
          <span className="inline-flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            <span>{buttonLabel}</span>
          </span>
        </button>
      }
      icon={<Trash2 className="w-6 h-6 text-rose-600" />}
      title={title ?? "Delete item"}
      description={description ?? "This action will permanently remove the item and cannot be undone."}
      confirmText="Delete"
      cancelText="Cancel"
      onConfirm={async () => {
        setLocalDisabled(true)
        try {
          await handleDelete()
        } finally {
          setLocalDisabled(false)
        }
      }}
    />
  )
}
