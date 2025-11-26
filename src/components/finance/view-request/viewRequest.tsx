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
        // try several common query shapes
        const attempts = [
          { params: { status: "approved", ordering: "-created_at" } },
          { params: { status: "APPROVED", ordering: "-created_at" } },
          {},
        ];

        let found: unknown = null;
        for (const a of attempts) {
          try {
            const res = await api.get("/purchases/requests/", a);
            const payload: unknown = (res?.data?.results ?? res?.data) as unknown;
            if (Array.isArray(payload) && payload.length > 0) {
              found = payload;
              break;
            }
            if (payload && typeof payload === "object") {
              const obj = payload as Record<string, unknown>;
              if (Array.isArray(obj.results) && obj.results.length > 0) {
                found = obj.results;
                break;
              }
              if (Array.isArray(obj.data) && obj.data.length > 0) {
                found = obj.data;
                break;
              }
            }
          } catch (err) {
            // try next
            console.debug("attempt failed for /purchases/requests/", a, err);
          }
        }

        if (mounted) setRequests(Array.isArray(found) ? (found as Req[]) : []);
      } catch (err: unknown) {
        console.error("Failed fetching approved requests", err);
        if (mounted) setError("Failed to load approved requests. Check console for details.");
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
        <p className="text-sm text-slate-500">All approved purchase requests visible to finance.</p>
      </header>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Loading approved requests…</div>
      ) : error ? (
        <div className="py-6 text-sm text-rose-600">{error}</div>
      ) : requests.length === 0 ? (
        <div className="py-6 text-sm text-slate-500">No approved requests found.</div>
      ) : (
        <div>
          {/* Mobile stacked cards */}
          <div className="md:hidden space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-800 truncate">{r.title ?? `Request ${r.id}`}</div>
                    <div className="text-xs text-slate-500 mt-1">{r.status ?? "APPROVED"}</div>
                    <div className="mt-2 text-sm text-slate-700 font-medium">{formatAmount(r.total_amount)}</div>
                    <div className="text-xs text-slate-500 mt-2">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</div>
                  </div>
                  <div className="ml-3 flex-shrink-0 flex flex-col items-end gap-2">
                    <Link href={`/dashboards/finance/${r.id}`} className="text-sm text-sky-600 hover:underline">View</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop/table view */}
          <div className="hidden md:block bg-white border rounded shadow-sm overflow-hidden">
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
                  <tr key={r.id} className="border-b last:border-b-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium truncate">{r.title ?? `Request ${r.id}`}</div>
                      <div className="text-xs text-slate-500">{r.status ?? "APPROVED"}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatAmount(r.total_amount)}</td>
                    <td className="px-4 py-3 text-slate-500">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboards/finance/${r.id}`} className="text-sm text-sky-600 hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}