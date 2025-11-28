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
  fileUrl: string,
  vendor: string,
  note?: string
): Promise<ReceiptResult> {
  const formData = new FormData()
  formData.append('file_url', fileUrl) // <-- match your Django model field
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
    // redirect to the related request view so user can see uploaded receipt
    try {
      if (typeof window !== 'undefined') {
        const dest = `/dashboards/staff/requests/${requestId}`
        // use location replace to avoid back-navigation to the submission form
        window.location.href = dest
      }
    } catch (e) {
      // ignore navigation errors
      console.error('redirect after receipt submit failed', e)
    }

    return res.data
  } catch (error) {
    // Use unknown type and type guard
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as { response?: unknown }).response === "object"
    ) {
      const response = (error as { response?: { data?: unknown } }).response;
      const data = response?.data as { error?: string; detail?: string } | string | undefined;
      const msg =
        typeof data === "string"
          ? data
          : data?.error || data?.detail || "Receipt submission failed";
      toast.error(msg);
    } else {
      toast.error("Receipt submission failed");
    }
    throw error;
  }
}