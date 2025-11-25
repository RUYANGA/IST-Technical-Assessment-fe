"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

type Req = {
  id: number | string;
  title?: string;
  total_amount?: number | string | null;
  created_at?: string | null;
  status?: string | null;
};

export default function ViewRequest() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<Req[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/purchases/requests/", {
          params: { status: "approved", ordering: "-created_at" },
        });
        const data = (res?.data?.results ?? res?.data) as unknown;
        if (mounted) setRequests(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        
        console.error("Failed fetching approved requests", err);
        if (mounted) setError("Failed to load approved requests");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  function formatAmount(v: number | string | null | undefined) {
    if (v == null || v === "") return "—";
    const n = Number(String(v).replace(/,/g, ""));
    if (!Number.isFinite(n)) return "—";
    return `Frw ${Math.round(n).toLocaleString()}`;
  }

  return (
    <section className="max-w-4xl mx-auto p-4">
      <header className="mb-4">
        <h2 className="text-xl font-semibold">Approved requests (Finance)</h2>
        <p className="text-sm text-slate-500">
          All approved purchase requests visible to finance.
        </p>
      </header>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">
          Loading approved requests…
        </div>
      ) : error ? (
        <div className="py-6 text-sm text-rose-600">{error}</div>
      ) : requests.length === 0 ? (
        <div className="py-6 text-sm text-slate-500">
          No approved requests found.
        </div>
      ) : (
        <div className="bg-white border rounded shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3 w-36 text-right">Amount</th>
                <th className="px-4 py-3 w-40">Created</th>
                <th className="px-4 py-3 w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr
                  key={r.id}
                  className="border-b last:border-b-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium truncate">
                      {r.title ?? `Request ${r.id}`}
                    </div>
                    <div className="text-xs text-slate-500">
                      {r.status ?? "APPROVED"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatAmount(r.total_amount)}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {r.created_at
                      ? new Date(r.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboards/finance/${r.id}`}
                      className="text-sm text-sky-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}