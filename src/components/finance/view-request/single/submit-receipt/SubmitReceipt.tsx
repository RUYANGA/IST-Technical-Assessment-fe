import React, { useState } from 'react'
import SubmitReceiptForm from './SubmitReceiptForm'
import { submitReceipt } from './submitReceiptService'

function SubmitReceipt({ requestId }: { requestId: number | string }) {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [vendor, setVendor] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!fileUrl || !vendor) {
      setError('File and vendor are required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await submitReceipt(requestId, fileUrl, vendor, note)
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
      vendor={vendor}
      note={note}
      fileUrl={fileUrl}
      setFileUrl={setFileUrl}
      setVendor={setVendor}
      setNote={setNote}
      handleSubmit={handleSubmit}
    />
  )
}

export default SubmitReceipt