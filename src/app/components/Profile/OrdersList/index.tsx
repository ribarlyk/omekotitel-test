"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ProfileSidebar } from "@/src/app/components/Profile/Sidebar";
import { ProfileSection } from "@/src/app/components/Profile/sections";
import { useCart } from "@/src/app/contexts/CartContext";
import { Loader2 } from "lucide-react";

const ORDER_STATUS: Record<string, string> = {
  pending: "Нова",
  pending_payment: "Изчакване на плащане",
  processing: "В обработка",
  complete: "Завършена",
  closed: "Затворен",
  canceled: "Отказан",
  holded: "На изчакване",
};

interface MagentoAddress {
  firstname: string;
  lastname: string;
}

interface OrderLineItem {
  item_id: number;
  name: string;
  product_type: string;
}

interface OrderItem {
  entity_id: number;
  increment_id: string;
  created_at: string;
  status: string;
  grand_total: number;
  order_currency_code: string;
  items?: OrderLineItem[];
  billing_address?: MagentoAddress;
  extension_attributes?: {
    shipping_assignments?: Array<{
      shipping?: { address?: MagentoAddress };
    }>;
  };
}

function getShipTo(order: OrderItem): string {
  const addr =
    order.extension_attributes?.shipping_assignments?.[0]?.shipping?.address ??
    order.billing_address;
  if (!addr) return "—";
  return `${addr.firstname} ${addr.lastname}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("bg-BG", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function formatCurrency(value: number, currency: string) {
  return `${value.toFixed(2)} ${currency === "EUR" ? "€" : currency}`;
}

const PAGE_SIZES = [10, 20, 50];

export const OrdersList = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshCart } = useCart();
  const page = Number(searchParams.get("p") ?? "1");
  const pageSize = Number(searchParams.get("ps") ?? "10");

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [reordering, setReordering] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    setApiError(null);
    fetch(`/api/customer/orders?page=${page}&pageSize=${pageSize}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setApiError(`${data.error}${data.detail ? ` — ${data.detail}` : ""}`);
          return;
        }
        setOrders(data.items ?? []);
        setTotalCount(data.total_count ?? 0);
      })
      .catch((e) => setApiError(String(e)))
      .finally(() => setLoading(false));
  }, [page, pageSize]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  const navigate = (newPage: number, newSize?: number) => {
    const ps = newSize ?? pageSize;
    router.push(`/sales/order/history?p=${newPage}&ps=${ps}`);
  };

  const handleReorder = async (id: number) => {
    setReordering(id);
    try {
      const res = await fetch(`/api/customer/orders/${id}/reorder`, { method: "POST" });
      if (res.ok) {
        await refreshCart();
        toast.success("Продуктите са добавени в количката.");
      } else {
        toast.error("Грешка при повторна поръчка.");
      }
    } finally {
      setReordering(null);
    }
  };

  const setSection = (s: ProfileSection) => router.push(`/customer/account?section=${s}`);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-10 flex flex-col-reverse md:flex-row gap-8 md:gap-10">
      <ProfileSidebar activeSection={ProfileSection.Orders} onSectionChange={setSection} />

      <main className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Моите поръчки</h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-brand-action" />
          </div>
        ) : apiError ? (
          <p className="text-sm text-red-500 font-mono bg-red-50 p-3 rounded">{apiError}</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Нямате поръчки.</p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden flex flex-col gap-3">
              {orders.map((order) => {
                const visibleItems = (order.items ?? [])
                  .filter((i) => i.product_type !== "configurable")
                  .slice(0, 3);
                const extraCount = (order.items ?? [])
                  .filter((i) => i.product_type !== "configurable").length - 3;
                return (
                  <div key={order.entity_id} className="border border-gray-100 p-4 flex flex-col gap-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-gray-700">#{order.increment_id}</span>
                      <span className="text-gray-500">{formatDate(order.created_at)}</span>
                    </div>

                    {/* Products */}
                    {visibleItems.length > 0 && (
                      <ul className="flex flex-col gap-0.5 border-l-2 border-brand-action-light pl-3 my-1">
                        {visibleItems.map((item) => (
                          <li key={item.item_id} className="text-xs text-gray-600 line-clamp-1">{item.name}</li>
                        ))}
                        {extraCount > 0 && (
                          <li className="text-xs text-gray-400">+{extraCount} още</li>
                        )}
                      </ul>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-gray-700">{formatCurrency(order.grand_total, order.order_currency_code)}</span>
                      {ORDER_STATUS[order.status] && (
                        <span className="text-gray-500">{ORDER_STATUS[order.status]}</span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => router.push(`/sales/order/view/order_id/${order.entity_id}`)}
                        className="bg-brand-action-light text-white px-3 py-1.5 text-xs font-semibold hover:bg-brand-action transition-colors"
                      >
                        Вижте
                      </button>
                      <button
                        onClick={() => handleReorder(order.entity_id)}
                        disabled={reordering === order.entity_id}
                        className="bg-brand-action-light text-white px-3 py-1.5 text-xs font-semibold hover:bg-brand-action transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        {reordering === order.entity_id ? <Loader2 size={14} className="animate-spin" /> : "Поръчай отново"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm text-gray-700 border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-semibold text-gray-600">Поръчка #</th>
                    <th className="text-left py-2 pr-4 font-semibold text-gray-600">Дата</th>
                    <th className="text-left py-2 pr-4 font-semibold text-gray-600">Ship To</th>
                    <th className="text-left py-2 pr-4 font-semibold text-gray-600">Поръчка общо вкл. ДДС</th>
                    <th className="text-left py-2 pr-4 font-semibold text-gray-600">Статус</th>
                    <th className="text-left py-2 font-semibold text-gray-600">Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.entity_id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 text-gray-500">{order.increment_id}</td>
                      <td className="py-3 pr-4">{formatDate(order.created_at)}</td>
                      <td className="py-3 pr-4">{getShipTo(order)}</td>
                      <td className="py-3 pr-4">{formatCurrency(order.grand_total, order.order_currency_code)}</td>
                      <td className="py-3 pr-4 text-gray-500">
                        {ORDER_STATUS[order.status] ?? order.status}
                      </td>
                      <td className="py-3 flex gap-2 flex-wrap">
                        <button
                          onClick={() => router.push(`/sales/order/view/order_id/${order.entity_id}`)}
                          className="bg-brand-action-light text-white px-3 h-7 text-xs font-semibold hover:bg-brand-action transition-colors"
                        >
                          Вижте поръчка
                        </button>
                        <button
                          onClick={() => handleReorder(order.entity_id)}
                          disabled={reordering === order.entity_id}
                          className="bg-brand-action-light text-white px-3 h-7 text-xs font-semibold hover:bg-brand-action transition-colors disabled:opacity-50 flex items-center justify-center min-w-27.5"
                        >
                          {reordering === order.entity_id ? <Loader2 size={14} className="animate-spin" /> : "Поръчай отново"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 flex-wrap gap-4">
              <p className="text-sm text-gray-500">
                Артикули {from} до {to} от {totalCount} общо
              </p>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => navigate(p)}
                    className={`w-8 h-8 text-sm border transition-colors ${
                      p === page
                        ? "border-brand-action text-brand-action font-semibold"
                        : "border-gray-300 text-gray-600 hover:border-brand-action hover:text-brand-action"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                {page < totalPages && (
                  <button
                    onClick={() => navigate(page + 1)}
                    className="w-8 h-8 text-sm border border-gray-300 text-gray-600 hover:border-brand-action hover:text-brand-action transition-colors"
                  >
                    ›
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                Покажи
                <select
                  value={pageSize}
                  onChange={(e) => navigate(1, Number(e.target.value))}
                  className="border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:border-brand-nav"
                >
                  {PAGE_SIZES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                на страница
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => router.push("/customer/account")}
                className="text-sm text-brand-action hover:underline"
              >
                Обратно
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
