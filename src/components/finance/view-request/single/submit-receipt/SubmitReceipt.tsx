import React, { useState } from 'react'
import SubmitReceiptForm from './SubmitReceiptForm'
import { submitReceipt, ReceiptResult } from './submitReceiptService'

function SubmitReceipt({ requestId }: { requestId: number | string }) {
  const [file, setFile] = useState<File | null>(null)
  const [vendor, setVendor] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ReceiptResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file || !vendor) {
      setError('File and vendor are required')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await submitReceipt(requestId, file, vendor, note)
      setResult(data)
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        setError((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Submission failed')
      } else {
        setError('Submission failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <SubmitReceiptForm
      loading={loading}
      error={error}
      result={result}
      vendor={vendor}
      note={note}
      setFile={setFile}
      setVendor={setVendor}
      setNote={setNote}
      handleSubmit={handleSubmit}
    />
  )
}

export default SubmitReceipt