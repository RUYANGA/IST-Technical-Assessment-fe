import React from "react"
import SingleRequest from "@/components/staff/request-view/single/SingleRequest"

export default function RequestPage({ params }: { params: { id: string } }) {
  return <SingleRequest id={params.id} />
}