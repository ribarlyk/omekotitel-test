"use client";

import { useState } from "react";
import TurnstileWidget from "@/src/app/components/Turnstile";

type Result = {
  revalidated: boolean;
  since: string;
  productCount: number;
  tags: string[];
};

type Mode = "today" | "24h";

export default function AdminRevalidatePage() {
  const [secret, setSecret] = useState("");
  const [cfToken, setCfToken] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("today");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const canAct = !!secret && !!cfToken && !loading;

  async function revalidateSmart() {
    if (!cfToken) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const token = cfToken;
    setCfToken(null);
    try {
      const res = await fetch(`/api/revalidate/smart?secret=${encodeURIComponent(secret)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ since: mode, cfToken: token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function revalidateAll(tag: string) {
    if (!cfToken) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const token = cfToken;
    setCfToken(null);
    try {
      const res = await fetch(`/api/revalidate?secret=${encodeURIComponent(secret)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag, cfToken: token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`);
      setResult({ revalidated: true, since: "-", productCount: -1, tags: [tag] });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-20 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-lg">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Cache Revalidation</h1>
        <p className="text-sm text-gray-500 mb-6">Flush Next.js cache for products updated in Magento.</p>

        <label className="block text-xs font-medium text-gray-600 mb-1">Secret</label>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="REVALIDATE_SECRET"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />

        <div className="mb-5">
          <TurnstileWidget
            onSuccess={setCfToken}
            onExpire={() => setCfToken(null)}
            onError={() => setCfToken(null)}
          />
        </div>

        {/* Smart revalidate */}
        <div className="border border-gray-200 rounded-xl p-4 mb-3">
          <p className="text-sm font-medium text-gray-800 mb-3">Revalidate changed products</p>
          <div className="flex gap-2 mb-3">
            {(["today", "24h"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  mode === m
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {m === "today" ? "Changed today (UTC)" : "Last 24 hours"}
              </button>
            ))}
          </div>
          <button
            onClick={revalidateSmart}
            disabled={!canAct}
            className="w-full bg-gray-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Working…" : "Flush changed products"}
          </button>
        </div>

        {/* Nuclear options */}
        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-800 mb-3">Flush everything</p>
          <div className="flex gap-2">
            <button
              onClick={() => revalidateAll("products")}
              disabled={!canAct}
              className="flex-1 border border-gray-300 text-gray-700 text-xs font-medium py-2 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              All products
            </button>
            <button
              onClick={() => revalidateAll("catalog")}
              disabled={!canAct}
              className="flex-1 border border-gray-300 text-gray-700 text-xs font-medium py-2 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Catalog / nav
            </button>
          </div>
        </div>

        {/* Results */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
            {result.productCount >= 0 ? (
              <>
                <p className="font-medium mb-1">
                  {result.productCount === 0
                    ? "No products changed — cache is already fresh."
                    : `${result.productCount} product${result.productCount !== 1 ? "s" : ""} revalidated.`}
                </p>
                {result.since !== "-" && (
                  <p className="text-xs text-green-700">Since: {new Date(result.since).toLocaleString("bg-BG")}</p>
                )}
                {result.tags.filter((t) => t.startsWith("product:") && !t.startsWith("products:")).length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer text-green-700">Products</summary>
                    <ul className="mt-1 space-y-0.5">
                      {result.tags.filter((t) => t.startsWith("product:") && !t.startsWith("products:")).map((t) => (
                        <li key={t} className="text-xs font-mono text-green-700">{t.replace("product:", "")}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </>
            ) : (
              <p className="font-medium">Flushed: <span className="font-mono">{result.tags[0]}</span></p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
