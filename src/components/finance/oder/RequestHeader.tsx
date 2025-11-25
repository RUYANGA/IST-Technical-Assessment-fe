import Link from "next/link"
import { useParams } from "next/navigation"

export default function RequestHeader() {
  const params = useParams()
  const id = typeof params?.id === "string" || typeof params?.id === "number" ? params.id : ""

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold">Request details</h1>
      <div className="flex items-center gap-2">
        <Link href="/dashboards/staff" className="text-sm px-3 py-2 rounded border hover:bg-slate-50">
          Back
        </Link>
        <Link
          href={`/dashboards/staff/submit-receipt/${id}`}
          className="text-sm px-3 py-2 rounded bg-sky-600 text-white hover:bg-sky-700"
        >
          Submit Receipt
        </Link>
      </div>
    </div>
  )
}