"use client";

import ViewReceipt from "@/components/finance/view-request/single/view-receipt/view-receipt";
import { useParams } from "next/navigation";

function ViewReceiptPage() {
  const params = useParams();
  const requestId = Number(params?.id);

  return <ViewReceipt requestId={requestId} />;
}

export default ViewReceiptPage;