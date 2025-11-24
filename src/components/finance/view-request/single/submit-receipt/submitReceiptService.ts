import api from '@/lib/api'
import toast from 'react-hot-toast'

export type ReceiptResult = {
  id: number
  file: string
  validated: boolean
  validation_report: unknown
  uploaded_at: string
  purchase_request_id: number
  uploaded_by_id: number
}

export async function submitReceipt(
  requestId: number | string,
  file: File,
  vendor: string,
  note?: string
): Promise<ReceiptResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('vendor', vendor)
  if (note) formData.append('note', note)

  try {
    const res = await api.post<ReceiptResult>(
      `/purchases/requests/${requestId}/submit-receipt/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    toast.success('Receipt submitted successfully!')
    return res.data
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as { response?: unknown }).response === 'object' &&
      (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
    ) {
      toast.error((error as { response: { data: { detail: string } } }).response.data.detail)
    } else {
      toast.error('Failed to submit receipt')
    }
    throw error
  }
}