import SingleRequestFinance from "@/components/finance/view-request/single/SingleRequest"

export default async function RequestPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const { id } = await params
  return <SingleRequestFinance id={id} />
}