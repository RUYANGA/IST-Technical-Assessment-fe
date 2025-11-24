import React from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { UploadButton } from "@uploadthing/react"
import type { OurFileRouter } from "@/app/api/uploadthing/core"
import toast from "react-hot-toast";

type UploadThingFile = {
  ufsUrl?: string;
  message?: string;
};

function SubmitReceiptForm({
  loading,
  vendor,
  note,
  fileUrl,
  setFileUrl,
  setVendor,
  setNote,
  handleSubmit,
}: {
  loading: boolean
  error: string | null
  result?: Record<string, unknown> | null
  vendor: string
  note: string
  fileUrl: string | null
  setFileUrl: (url: string | null) => void
  setVendor: (vendor: string) => void
  setNote: (note: string) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}) {
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
        
        <UploadButton<OurFileRouter, "imageUploader">
          endpoint="imageUploader"
          onClientUploadComplete={res => {
            const file = res[0] as UploadThingFile;
            if (file.message) {
              toast.success(file.message);
            }
            if (file.ufsUrl) {
              setFileUrl(file.ufsUrl);
            }
          }}
          onUploadError={err => {
             toast.success(err.message);
          }}
        />
        {fileUrl && (
          <p className="text-xs text-green-600 mt-2">File uploaded! Ready to submit.</p>
        )}
       
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
        disabled={loading || !fileUrl}
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
    </form>
  )
}

export default SubmitReceiptForm