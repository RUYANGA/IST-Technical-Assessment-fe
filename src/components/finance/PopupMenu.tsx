import React, { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

type PopupMenuProps = {
  anchor: DOMRect | null
  children: React.ReactNode
  onClose?: () => void
}

export function PopupMenu({ anchor, children, onClose }: PopupMenuProps) {
  const [container] = useState<HTMLElement>(() => document.createElement("div"))
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.appendChild(container)
    return () => {
      document.body.removeChild(container)
    }
  }, [container])

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        onClose?.()
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => {
      document.removeEventListener("mousedown", handleClick)
    }
  }, [onClose])

  if (!anchor || !container) return null

  const menuWidth = 192
  let left = anchor.right + window.scrollX - menuWidth
  if (left < 8) left = anchor.left + window.scrollX
  if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8

  const top = anchor.bottom + window.scrollY

  return createPortal(
    <div
      ref={menuRef}
      style={{ position: "absolute", top, left, width: menuWidth, zIndex: 9999 }}
      className="w-48 bg-white border shadow-sm rounded"
    >
      {children}
    </div>,
    container
  )
}