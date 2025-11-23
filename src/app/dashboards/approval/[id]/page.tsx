import React from "react"
// use explicit path to the component's page file
import SingleRequest from "@/components/approval/approve/single/SingleRequest"

export default async function RequestPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const { id } = await params
  return <SingleRequest id={id} />
}