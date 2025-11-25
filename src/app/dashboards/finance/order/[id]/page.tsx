import ViewSingleOrder from '@/components/finance/oder/viewSingleOrder'
import React from 'react'

export default function ViewSingle({ params }: { params: { id: string } }) {
  return <ViewSingleOrder id={params.id} />
}