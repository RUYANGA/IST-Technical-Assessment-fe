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

/**
 * ViewSingleOrder
 * Props:
 *  - id?: number | string  (order id). If not provided, component will try to parse id from the URL pathname.
 */
export default function ViewSingleOrder({ id }: { id?: number | string }) {
  const [loading, setLoading] = useState<boolean>(true);
  const [order, setOrder] = useState<PurchaseOrderRaw | null>(null);
  const [error, setError] = useState<string | null>(null);

  // try to derive id from pathname if not passed
  function resolveIdFromPath(): string | undefined {
    if (id) return String(id);
    if (typeof window === "undefined") return undefined;
    const parts = window.location.pathname.split("/").filter(Boolean);
    // assume the id is the last segment
    const last = parts[parts.length - 1];
    return last && /\d+/.test(last) ? last : undefined;
  }

  useEffect(() => {
    let mounted = true;
    async function load() {
      const resolved = resolveIdFromPath();
      if (!resolved) {
        if (mounted) {
          setError("No purchase order id provided");
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/purchases/purchase-orders/${resolved}/`);
        const data = res?.data as PurchaseOrderRaw;
        if (mounted) setOrder(data ?? null);
      } catch (err) {
       
        console.error("Failed to fetch purchase order", err);
        if (mounted) setError("Failed to load purchase order");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function formatAmount(v: unknown) {
    if (v == null || v === "") return "—";
    const n = Number(String(v).replace(/,/g, ""));
    if (!Number.isFinite(n)) return "—";
    return `Frw ${Math.round(n).toLocaleString()}`;
  }

  function formatDate(d?: string | null) {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  }

  if (loading) {
    return <div className="p-4 text-sm text-slate-500">Loading purchase order…</div>;
  }

  if (error) {
    return <div className="p-4 text-sm text-rose-600">{error}</div>;
  }

  if (!order) {
    return <div className="p-4 text-sm text-slate-500">Purchase order not found.</div>;
  }

  const data: PurchaseOrderData = (order.data ?? {}) as PurchaseOrderData;
  const pr: PurchaseRequestSummary | null = order.purchase_request ?? null;
  const poNum = order.po_number && String(order.po_number).trim() !== "" ? order.po_number : `PO ${order.id}`;
  const title = pr?.title ?? (data.title && String(data.title).trim() !== "" ? data.title : poNum);
  const items: PurchaseOrderItem[] =
    Array.isArray(data.items) ? (data.items as PurchaseOrderItem[]) : Array.isArray(pr?.items) ? (pr!.items as PurchaseOrderItem[]) : [];
  const total =
    (data.total_amount as string | number | undefined) ??
    (data.total as string | number | undefined) ??
    (pr?.total_amount as string | number | undefined) ??
    (items.length
      ? items.reduce((s: number, it: PurchaseOrderItem) => {
          const q = Number(it.quantity ?? 0) || 0;
          const up = Number(String(it.unit_price ?? 0).replace(/,/g, "")) || 0;
          return s + q * up;
        }, 0)
      : undefined);
  const generated = data.created_at ?? order.generated_at ?? pr?.created_at;
  const approverName = order.approver
    ? (order.approver.full_name ?? `${order.approver.first_name ?? ""} ${order.approver.last_name ?? ""}`.trim())
    : null;

  return (
    <section className="max-w-4xl mx-auto p-6 bg-white rounded shadow-sm">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <div className="text-sm text-slate-500 mt-1">PO: <span className="font-medium">{poNum}</span></div>
        </div>

        <div className="text-right">
          <div className="text-sm text-slate-500">Generated</div>
          <div className="font-medium">{formatDate(generated)}</div>
          {approverName && (
            <>
              <div className="text-xs text-slate-500 mt-2">Approver</div>
              <div className="font-medium">{approverName}</div>
            </>
          )}
        </div>
      </header>

      <section className="mb-4">
        <h2 className="text-sm font-medium text-slate-700">Items</h2>
        {items.length === 0 ? (
          <div className="text-sm text-slate-500 mt-2">No items on this PO.</div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2 w-24 text-center">Qty</th>
                  <th className="px-3 py-2 w-36 text-right">Unit price</th>
                  <th className="px-3 py-2 w-36 text-right">Line total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const qty = Number(it.quantity ?? 0) || 0;
                  const up = Number(String(it.unit_price ?? 0).replace(/,/g, "")) || 0;
                  const line = qty * up;
                  return (
                    <tr key={String(it.id ?? idx)} className="border-b last:border-b-0 hover:bg-slate-50">
                      <td className="px-3 py-2">{it.name ?? `Item ${idx + 1}`}</td>
                      <td className="px-3 py-2 text-center">{qty}</td>
                      <td className="px-3 py-2 text-right">{formatAmount(up)}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatAmount(line)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex items-center justify-end gap-6">
        <div className="text-sm text-slate-600">Total</div>
        <div className="text-lg font-semibold">{formatAmount(total)}</div>
      </section>

      {pr ? (
        <footer className="mt-6 text-sm text-slate-600">
          Linked purchase request:{" "}
          <Link href={`/dashboards/staff/requests/${pr.id}`} className="text-sky-600 hover:underline">
            PR #{pr.id} — {pr.title ?? "View request"}
          </Link>
        </footer>
      ) : null}
    </section>
  );
}