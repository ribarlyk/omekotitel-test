"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { Printer } from "lucide-react";
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

interface Address {
  firstname: string;
  lastname: string;
  street: string[];
  city: string;
  region?: string;
  postcode: string;
  country_id: string;
  telephone: string;
}

interface OrderItemLine {
  item_id: number;
  name: string;
  sku: string;
  price: number;
  qty_ordered: number;
  qty_canceled: number;
  qty_shipped: number;
  row_total: number;
  product_type: string;
}

interface Order {
  entity_id: number;
  increment_id: string;
  created_at: string;
  status: string;
  grand_total: number;
  subtotal: number;
  shipping_amount: number;
  shipping_description: string;
  order_currency_code: string;
  billing_address: Address;
  extension_attributes?: {
    shipping_assignments?: Array<{
      shipping?: { address?: Address };
    }>;
  };
  payment?: { method: string; additional_information?: string[] };
  items: OrderItemLine[];
}

const PAYMENT_LABELS: Record<string, string> = {
  cashondelivery: "Наложен платеж",
  revolut: "Картово плащане",
  free: "Безплатно",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("bg-BG", { day: "numeric", month: "long", year: "numeric" });
}

function fmt(value: number, currency: string) {
  return `${value.toFixed(2)} ${currency === "EUR" ? "€" : currency}`;
}

function AddressBlock({ address }: { address: Address }) {
  return (
    <div className="text-sm leading-6">
      <p>{address.firstname} {address.lastname}</p>
      {address.street.map((line, i) => line && <p key={i}>{line}</p>)}
      <p>{address.city}{address.region ? `, ${address.region}` : ""}, {address.postcode}</p>
      <p>България</p>
      <p>Т: {address.telephone}</p>
    </div>
  );
}

interface Props { orderId: string }

export const OrderDetail = ({ orderId }: Props) => {
  const router = useRouter();
  const { refreshCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    fetch(`/api/customer/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => setOrder(data.error ? null : data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleReorder = async () => {
    setReordering(true);
    try {
      const res = await fetch(`/api/customer/orders/${orderId}/reorder`, { method: "POST" });
      if (res.ok) {
        await refreshCart();
        toast.success("Продуктите са добавени в количката.");
      } else {
        toast.error("Грешка при повторна поръчка.");
      }
    } finally {
      setReordering(false);
    }
  };

  const setSection = (s: ProfileSection) => router.push(`/customer/account?section=${s}`);

  const visibleItems = order?.items.filter((i) => i.product_type !== "configurable") ?? [];
  const currency = order?.order_currency_code ?? "EUR";
  const shippingAddress = order?.extension_attributes?.shipping_assignments?.[0]?.shipping?.address ?? order?.billing_address;
  const paymentLabel = order?.payment ? (PAYMENT_LABELS[order.payment.method] ?? order.payment.method) : "";
  const paymentNote = order?.payment?.additional_information?.[0];

  return (
    <>
      {/* Print-only layout */}
      {order && (
        <div className="hidden print:block text-sm text-black font-sans p-8">
          <style>{`@page { margin: 1.5cm; } @media print { body { -webkit-print-color-adjust: exact; } }`}</style>

          {/* Header */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-800">
            <Image src="/assets/omekotitel-bg_1.avif" alt="Омекотител лого" width={180} height={86} />
            <div className="text-right">
              <p className="text-lg font-bold">Поръчка # {order.increment_id}</p>
              <p className="text-gray-500 text-xs mt-1">{formatDate(order.created_at)}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide">{ORDER_STATUS[order.status] ?? order.status}</p>
            </div>
          </div>

          {/* Address + shipping/payment info — 2-col only when space allows */}
          <div className="grid grid-cols-2 gap-6 mb-8 text-xs">
            <div className="border border-gray-200 rounded p-3">
              <h2 className="font-bold text-gray-500 uppercase tracking-wide text-xs mb-2">Адрес за доставка</h2>
              {shippingAddress && <AddressBlock address={shippingAddress} />}
            </div>
            <div className="border border-gray-200 rounded p-3">
              <h2 className="font-bold text-gray-500 uppercase tracking-wide text-xs mb-2">Метод на доставка</h2>
              <p>{order.shipping_description}</p>
              <h2 className="font-bold text-gray-500 uppercase tracking-wide text-xs mt-4 mb-2">Метод на плащане</h2>
              <p>{paymentLabel}</p>
              {paymentNote && <p className="text-gray-500 mt-1">{paymentNote}</p>}
            </div>
            <div className="border border-gray-200 rounded p-3">
              <h2 className="font-bold text-gray-500 uppercase tracking-wide text-xs mb-2">Адрес за фактуриране</h2>
              <AddressBlock address={order.billing_address} />
            </div>
          </div>

          {/* Items table */}
          <h2 className="font-bold text-gray-700 uppercase tracking-wide text-xs mb-3">Поръчани артикули</h2>
          <table className="w-full text-xs border-collapse mb-6" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "40%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "14%" }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="text-left py-2 px-2 font-semibold">Продукт</th>
                <th className="text-left py-2 px-2 font-semibold">Кат. номер</th>
                <th className="text-right py-2 px-2 font-semibold">Цена</th>
                <th className="text-right py-2 px-2 font-semibold">Кол.</th>
                <th className="text-right py-2 px-2 font-semibold">Сума</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => (
                <tr key={item.item_id} className="border-b border-gray-100">
                  <td className="py-2 px-2 wrap-break-word">{item.name}</td>
                  <td className="py-2 px-2 text-gray-500 wrap-break-word">{item.sku}</td>
                  <td className="py-2 px-2 text-right">{fmt(item.price, currency)}</td>
                  <td className="py-2 px-2 text-right">{item.qty_ordered}</td>
                  <td className="py-2 px-2 text-right font-medium">{fmt(item.row_total, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex flex-col items-end gap-1 border-t-2 border-gray-800 pt-4 text-xs">
            <div className="flex justify-between w-48"><span className="text-gray-500">Сума</span><span>{fmt(order.subtotal, currency)}</span></div>
            <div className="flex justify-between w-48"><span className="text-gray-500">Доставка</span><span>{fmt(order.shipping_amount, currency)}</span></div>
            <div className="flex justify-between w-48 font-bold text-sm border-t border-gray-300 pt-2 mt-1"><span>Обща сума</span><span>{fmt(order.grand_total, currency)}</span></div>
          </div>
        </div>
      )}

      {/* Screen layout */}
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10 flex flex-col-reverse md:flex-row gap-8 md:gap-10 print:hidden">
        <ProfileSidebar activeSection={ProfileSection.Orders} onSectionChange={setSection} />

        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-brand-action" />
            </div>
          ) : !order ? (
            <p className="text-sm text-gray-500">Поръчката не е намерена.</p>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">
                Поръчка # {order.increment_id}
              </h1>

              <p className="text-sm text-gray-500 mb-1">{ORDER_STATUS[order.status] ?? order.status}</p>
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-semibold">Дата на поръчката:</span>{" "}
                {formatDate(order.created_at)}
              </p>

              {/* Actions */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-t border-b border-gray-200 py-3 mb-6">
                <button
                  onClick={handleReorder}
                  disabled={reordering}
                  className="bg-brand-action-light text-white px-4 py-2 text-sm font-semibold hover:bg-brand-action transition-colors disabled:opacity-50 flex items-center justify-center w-full md:w-auto md:min-w-36"
                >
                  {reordering ? <Loader2 size={14} className="animate-spin" /> : "Поръчай отново"}
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-action transition-colors"
                >
                  <Printer size={16} />
                  Разпечатайте поръчката
                </button>
              </div>

              {/* Items */}
              <h2 className="text-base font-semibold text-gray-700 mb-3">Поръчани артикули</h2>

              {/* Mobile cards */}
              <div className="sm:hidden flex flex-col gap-3 mb-6">
                {visibleItems.map((item) => (
                  <div key={item.item_id} className="border border-gray-100 p-4 flex flex-col gap-1 text-sm">
                    <p className="font-semibold text-gray-700">{item.name}</p>
                    <p className="text-gray-400 text-xs">{item.sku}</p>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-500">Цена: {fmt(item.price, currency)}</span>
                      <span className="text-gray-500">Кол.: {item.qty_ordered}</span>
                    </div>
                    {item.qty_canceled > 0 && <p className="text-gray-400 text-xs">Отказан: {item.qty_canceled}</p>}
                    {item.qty_shipped > 0 && <p className="text-gray-400 text-xs">Изпратен: {item.qty_shipped}</p>}
                    <p className="font-semibold text-gray-700 mt-1">Сума: {fmt(item.row_total, currency)}</p>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto mb-6">
                <table className="w-full text-sm text-gray-700 border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 pr-4 font-semibold text-gray-600">Име на продукт</th>
                      <th className="text-left py-2 pr-4 font-semibold text-gray-600">Кат. номер</th>
                      <th className="text-right py-2 pr-4 font-semibold text-gray-600">Цена</th>
                      <th className="text-right py-2 pr-4 font-semibold text-gray-600">Кол.</th>
                      <th className="text-right py-2 font-semibold text-gray-600">Сума</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleItems.map((item) => (
                      <tr key={item.item_id} className="border-b border-gray-100">
                        <td className="py-3 pr-4 text-gray-600">{item.name}</td>
                        <td className="py-3 pr-4 text-gray-500">{item.sku}</td>
                        <td className="py-3 pr-4 text-right">{fmt(item.price, currency)}</td>
                        <td className="py-3 pr-4 text-right text-gray-500 text-xs leading-5">
                          <span>Поръчан: {item.qty_ordered}</span>
                          {item.qty_canceled > 0 && <><br />Отказан: {item.qty_canceled}</>}
                          {item.qty_shipped > 0 && <><br />Изпратен: {item.qty_shipped}</>}
                        </td>
                        <td className="py-3 text-right">{fmt(item.row_total, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex flex-col gap-1 text-sm border-t border-gray-200 pt-4 sm:items-end">
                <div className="flex justify-between sm:justify-end sm:gap-12">
                  <span className="text-gray-500">Сума</span>
                  <span>{fmt(order.subtotal, currency)}</span>
                </div>
                <div className="flex justify-between sm:justify-end sm:gap-12">
                  <span className="text-gray-500">Доставка &amp; обработка</span>
                  <span>{fmt(order.shipping_amount, currency)}</span>
                </div>
                <div className="flex justify-between sm:justify-end sm:gap-12 font-semibold text-base mt-1">
                  <span>Обща сума</span>
                  <span>{fmt(order.grand_total, currency)}</span>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => router.push("/sales/order/history")}
                  className="text-sm text-brand-action hover:underline"
                >
                  Назад към моите поръчки
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
};
