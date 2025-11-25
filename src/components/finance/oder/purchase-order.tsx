"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

type PurchaseOrderItem = {
  id?: number | string;
  name?: string;
  quantity?: number;
  unit_price?: string | number;
};

type PurchaseOrderData = {
  title?: string;
  items?: PurchaseOrderItem[];
  total_amount?: string | number | null;
  total?: string | number | null;
  created_at?: string | null;
  purchase_request_id?: string | number | null;
  [key: string]: unknown;
};

type PurchaseRequestSummary = {
  id?: number | string;
  title?: string;
  description?: string;
  status?: string;
  total_amount?: string | number | null;
  created_at?: string | null;
  items?: PurchaseOrderItem[];
};

type Approver = {
  id?: number | string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
};

type PurchaseOrderRaw = {
  id: number | string;
  po_number?: string | null;
  data?: PurchaseOrderData | null;
  generated_at?: string | null;
  approver?: Approver | null;
  purchase_request?: PurchaseRequestSummary | null;
};

export default function PurchaseOrderList() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<PurchaseOrderRaw[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/purchases/purchase-orders/");
        const data = (res?.data?.results ?? res?.data) as unknown;
        if (mounted) setOrders(Array.isArray(data) ? (data as PurchaseOrderRaw[]) : []);
      } catch (err) {
        console.error("Failed to fetch purchase orders", err);
        if (mounted) setError("Failed to load purchase orders");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  function formatAmount(v: unknown) {
    if (v == null || v === "") return "—";
    const n = Number(String(v).replace(/,/g, ""));
    if (!Number.isFinite(n)) return "—";
    return `Frw ${Math.round(n).toLocaleString()}`;
  }

  function formatDate(d?: string | null) {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return d;
    }
  }

  return (
    <section className="max-w-6xl mx-auto p-4">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Purchase Orders</h2>
          <p className="text-sm text-slate-500">All purchase orders</p>
        </div>
      </header>

      {loading ? (
        <div className="py-8 text-center text-sm text-slate-500">Loading purchase orders…</div>
      ) : error ? (
        <div className="py-4 text-sm text-rose-600">{error}</div>
      ) : orders.length === 0 ? (
        <div className="py-6 text-sm text-slate-500">No purchase orders found.</div>
      ) : (
        <div className="bg-white border rounded shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="px-4 py-3">PO #</th>
                <th className="px-4 py-3">Reference / Title</th>
                <th className="px-4 py-3 w-28 text-center">Items</th>
                <th className="px-4 py-3 w-36 text-right">Total</th>
                <th className="px-4 py-3 w-40">Generated</th>
                <th className="px-4 py-3 w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const poNum = o.po_number && String(o.po_number).trim() !== "" ? o.po_number : "—";
                const data: PurchaseOrderData = (o.data ?? {}) as PurchaseOrderData;
                const pr: PurchaseRequestSummary | null = o.purchase_request ?? null;

                // prefer the purchase request title when available, otherwise use data.title (request title)
                const reference =
                  (pr?.title && String(pr.title).trim() !== "" ? pr.title : undefined) ??
                  (data.title && String(data.title).trim() !== "" ? data.title : undefined) ??
                  (data.purchase_request_id ? `PR ${data.purchase_request_id}` : undefined) ??
                  poNum ??
                  `PO ${o.id}`;
                const displayTitle = String(pr?.title ?? data.title ?? reference);

                const itemsFromData: PurchaseOrderItem[] =
                  Array.isArray(data.items) ? (data.items as PurchaseOrderItem[]) : Array.isArray(pr?.items) ? (pr!.items as PurchaseOrderItem[]) : [];
                const itemsCount = itemsFromData.length;

                const totalValue:
                  | string
                  | number
                  | undefined =
                  (data.total_amount as string | number | undefined) ??
                  (data.total as string | number | undefined) ??
                  (pr?.total_amount as string | number | undefined) ??
                  (itemsCount
                    ? itemsFromData.reduce((s: number, it: PurchaseOrderItem) => {
                        const q = Number(it.quantity ?? 0) || 0;
                        const up = Number(String(it.unit_price ?? 0).replace(/,/g, "")) || 0;
                        return s + q * up;
                      }, 0)
                    : undefined);

                const generated = data.created_at ?? o.generated_at ?? pr?.created_at;

                return (
                  <tr key={o.id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium truncate">{poNum}</td>

                    <td className="px-4 py-3 text-slate-700 truncate" title={displayTitle}>
                      <div className="font-medium">{displayTitle}</div>
                      {pr ? (
                        <div className="text-xs text-slate-500 mt-1">
                          PR #{pr.id} — {pr.status ?? "—"}
                        </div>
                      ) : null}

                      {itemsCount > 0 && (
                        <div className="text-xs text-slate-500 mt-1">
                          {itemsFromData.slice(0, 3).map((it, i) => (
                            <span key={String(it.id ?? i)} className="inline-block mr-2">
                              {it.name ?? `Item ${i + 1}`}
                              {it.quantity ? ` ×${it.quantity}` : ""}
                            </span>
                          ))}
                          {itemsCount > 3 && <span className="text-slate-400">+{itemsCount - 3} more</span>}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs rounded bg-slate-100 text-slate-700">
                        {itemsCount}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-medium">{formatAmount(totalValue)}</td>

                    <td className="px-4 py-3 text-slate-500">{formatDate(generated)}</td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link href={`/dashboards/finance/order/${o.id}`} className="text-sm text-sky-600 hover:underline">
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}