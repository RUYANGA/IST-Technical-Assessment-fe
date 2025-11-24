import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface SubmitReceiptFormProps {
  loading: boolean
  error: string | null
  result: Record<string, unknown> | null
  vendor: string
  note: string
  setFile: (file: File | null) => void
  setVendor: (vendor: string) => void
  setNote: (note: string) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}

function SubmitReceiptForm({
  loading,
  error,
  vendor,
  note,
  setFile,
  setVendor,
  setNote,
  handleSubmit,
}: SubmitReceiptFormProps) {
  const params = useParams()
  const id = typeof params?.id === "string" || typeof params?.id === "number" ? params.id : ""

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-6 space-y-6 bg-white rounded-lg shadow-md border"
      aria-label="Submit Receipt Form"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800">Upload Receipt/Invoice</h2>
        <Link
          href={`/dashboards/finance/${id}`}
          className="text-sm px-3 py-2 rounded border bg-slate-50 hover:bg-slate-100 text-slate-700"
        >
          Back to Request
        </Link>
      </div>
      <div>
        <label htmlFor="receipt-file" className="block mb-2 font-medium text-slate-700">
          Receipt File <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="receipt-file"
            type="file"
            accept="application/pdf"
            onChange={e => setFile(e.target.files?.[0] || null)}
            required
            className="block w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
            title="Upload receipt PDF"
          />
          <span className="absolute right-3 top-2 text-slate-400 pointer-events-none">
            
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Only PDF files are accepted. Max size 5MB.</p>
      </div>
      <div>
        <label htmlFor="vendor-name" className="block mb-2 font-medium text-slate-700">
          Vendor Name <span className="text-red-500">*</span>
        </label>
        <input
          id="vendor-name"
          type="text"
          value={vendor}
          onChange={e => setVendor(e.target.value)}
          required
          className="block w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          placeholder="Enter vendor name"
        />
      </div>
      <div>
        <label htmlFor="note" className="block mb-2 font-medium text-slate-700">
          Note <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          id="note"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="block w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          placeholder="Add a note (optional)"
          rows={3}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-sky-600 text-white px-4 py-2 rounded font-semibold hover:bg-sky-700 transition disabled:opacity-50"
      >
        {loading ? (
          <span>
            <span className="animate-spin inline-block mr-2">&#9696;</span>
            Submitting...
          </span>
        ) : (
          "Submit Receipt"
        )}
      </button>
      {error && (
        <div className="text-red-600 mt-2 border border-red-200 bg-red-50 rounded px-3 py-2">
          {error}
        </div>
      )}
    </form>
  )
}

export default SubmitReceiptForm