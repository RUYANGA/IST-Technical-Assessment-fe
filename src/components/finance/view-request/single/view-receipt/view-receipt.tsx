import React, { useEffect, useState } from "react"
import api from "@/lib/api"

type Receipt = {
  id: number
  file_url: string
  uploaded_at: string
  purchase_request_id: number
  uploaded_by_id: number
  note?: string | null
  vendor?: string | null
}

type ViewReceiptProps = {
  requestId: number
}

function ViewReceipt({ requestId }: ViewReceiptProps) {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [popupUrl, setPopupUrl] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true;

    async function fetchReceipts() {
      setLoading(true)
      try {
        const res = await api.get(`/purchases/requests/${requestId}/receipts/`)
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.receipts)
            ? res.data.receipts
            : [];
        if (isMounted) {
          setReceipts(data)
          setError(null)
        }
      } catch {
        if (isMounted) {
          setError("Failed to load receipts.")
          setReceipts([])
        }
      }
      if (isMounted) setLoading(false)
    }

    fetchReceipts()
    return () => { isMounted = false }
  }, [requestId])

  if (loading) return <div>Loading receipts...</div>
  if (error) return <div className="text-red-500">{error}</div>
  if (receipts.length === 0) return <div>No receipts found for this request.</div>

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Receipts for Request #{requestId}</h2>

      <ul className="space-y-3">
        {receipts.map(receipt => (
          <li key={receipt.id} className="border rounded p-3 flex flex-col gap-2">
            <a
              href="#"
              className="text-sky-700 hover:underline text-left"
              onClick={e => {
                e.preventDefault();
                setPopupUrl(receipt.file_url);
              }}
            >
              View Document
            </a>
            <div className="text-xs text-slate-500">
              Uploaded at {receipt.uploaded_at}
              {receipt.vendor && <> | Vendor: {receipt.vendor}</>}
              {receipt.note && <> | Note: {receipt.note}</>}
            </div>
          </li>
        ))}
      </ul>

      {/* Popup Modal */}
      {popupUrl && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-9999"
          onClick={() => setPopupUrl(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-[80vh] p-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-3">Document Preview</h3>

            <iframe
              src={popupUrl}
              className="w-full h-full border rounded"
              title="Document Viewer"
            />

            <button
              className="absolute top-3 right-3 px-3 py-1 bg-sky-700 text-white rounded hover:bg-sky-800"
              onClick={() => setPopupUrl(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ViewReceipt
