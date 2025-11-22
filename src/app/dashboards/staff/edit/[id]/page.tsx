import UpdateRequestPage from '@/components/staff/update-request/page'

export default async function EditRequest({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const { id } = await params
  return <UpdateRequestPage id={id} />
}