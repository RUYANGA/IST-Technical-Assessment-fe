"use client"

import SubmitReceipt from '@/components/finance/view-request/single/submit-receipt/SubmitReceipt'
import { useParams } from 'next/navigation'

function SubmitOcumentPage() {
  const params = useParams()
  const id = typeof params?.id === 'string' || typeof params?.id === 'number' ? params.id : ''

  return (
    <SubmitReceipt requestId={id} />
  )
}

export default SubmitOcumentPage