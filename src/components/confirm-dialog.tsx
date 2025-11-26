"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";

export function ConfirmDialog({
  trigger,
  title,
  description,
  icon,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
}: {
  // accept either an element (preferred) or arbitrary node
  trigger: React.ReactElement | React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleOpen = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    setOpen(true);
  };
  const handleClose = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    if (!busy) setOpen(false);
  };

  async function handleConfirm(e?: React.SyntheticEvent) {
    e?.stopPropagation();
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  // wrap trigger so clicking it opens dialog
  // narrow the element props to include an optional onClick without using `any`
  type ElementWithOnClick = {
    onClick?: (e: React.SyntheticEvent) => void;
    [key: string]: unknown;
  };

  const TriggerEl = React.isValidElement(trigger)
    ? // cast to ReactElement with a safe prop shape that includes onClick
      React.cloneElement(trigger as React.ReactElement<ElementWithOnClick>, {
        onClick: (e: React.SyntheticEvent) => {
          // call original handler if present
          const orig = (trigger as React.ReactElement<ElementWithOnClick>).props.onClick;
          if (typeof orig === "function") orig(e);
          handleOpen(e);
        },
      })
    : (
      <button onClick={handleOpen}>{trigger}</button>
    );

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            {icon ? (
              <div className="shrink-0">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                  {icon}
                </div>
              </div>
            ) : null}
            <div className="min-w-0">
              <h3 id="confirm-dialog-title" className="text-lg font-semibold text-slate-900">
                {title ?? "Are you sure?"}
              </h3>
              {description ? (
                <p id="confirm-dialog-desc" className="mt-2 text-sm text-slate-600">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-md border bg-white text-sm text-slate-700 hover:bg-slate-100"
            disabled={busy}
          >
            {cancelText}
          </button>

          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-md bg-rose-600 text-white text-sm hover:bg-rose-700 disabled:opacity-60 inline-flex items-center gap-2"
            disabled={busy}
          >
            {busy ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : null}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {TriggerEl}
      {open && typeof document !== "undefined" ? createPortal(modal, document.body) : null}
    </>
  );
}

export default ConfirmDialog;
