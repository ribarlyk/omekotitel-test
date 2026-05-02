"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ProfileSection } from "@/src/app/components/Profile/sections";
import { useCart } from "@/src/app/contexts/CartContext";
import type { CustomerAccount, CustomerAddress } from "@/src/app/types/customer";

interface Props {
  customer: CustomerAccount;
  onSectionChange: (section: ProfileSection) => void;
}

interface RestOrderItem {
  item_id: number;
  name: string;
  product_type: string;
}

interface RestOrder {
  entity_id: number;
  increment_id: string;
  created_at: string;
  status: string;
  grand_total: number;
  order_currency_code: string;
  items?: RestOrderItem[];
  extension_attributes?: {
    shipping_assignments?: Array<{ shipping?: { address?: { firstname: string; lastname: string } } }>;
  };
  billing_address?: { firstname: string; lastname: string };
}

const ORDER_STATUS: Record<string, string> = {
  pending: "Нова",
  pending_payment: "Изчакване на плащане",
  processing: "В обработка",
  complete: "Завършена",
  closed: "Затворен",
  canceled: "Отказан",
  holded: "На изчакване",
};

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("bg-BG", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function formatCurrency(value: number, currency: string): string {
  return `${value.toFixed(2)} ${currency === "EUR" ? "€" : currency}`;
}

function getShipTo(order: RestOrder): string {
  const addr =
    order.extension_attributes?.shipping_assignments?.[0]?.shipping?.address ??
    order.billing_address;
  if (!addr) return "—";
  return `${addr.firstname} ${addr.lastname}`;
}

function AddressBlock({ address }: { address: CustomerAddress | undefined }) {
  if (!address) {
    return <p className="text-sm text-gray-500 italic">Няма зададен адрес.</p>;
  }
  return (
    <div className="text-sm text-gray-700 leading-6">
      <p>{address.firstname} {address.lastname}</p>
      {address.street.map((line, i) => <p key={i}>{line}</p>)}
      <p>{address.city}{address.region?.region ? `, ${address.region.region}` : ""}, {address.postcode}</p>
      <p>България</p>
      <p>T: {address.telephone}</p>
    </div>
  );
}

export const AccountDashboard = ({ customer, onSectionChange }: Props) => {
  const router = useRouter();
  const { refreshCart } = useCart();
  const defaultBilling = customer.addresses.find((a) => a.default_billing);
  const defaultShipping = customer.addresses.find((a) => a.default_shipping);

  const [recentOrders, setRecentOrders] = useState<RestOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [reordering, setReordering] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/customer/orders?pageSize=5")
      .then((r) => r.json())
      .then((data) => setRecentOrders(data.items ?? []))
      .catch(() => setRecentOrders([]))
      .finally(() => setOrdersLoading(false));
  }, []);

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

  return (
    <div className="flex flex-col gap-8">
      {/* Profile Info */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Информация за профила
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Contact info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Информация за контакт</h3>
            <p className="text-sm text-gray-700">{customer.firstname} {customer.lastname}</p>
            <p className="text-sm text-gray-700">{customer.email}</p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => onSectionChange(ProfileSection.Details)} className="bg-brand-action-light text-white px-3 py-1.5 text-xs font-semibold hover:bg-brand-action transition-colors">
                Редактирай
              </button>
              <button onClick={() => onSectionChange(ProfileSection.Details)} className="bg-brand-action-light text-white px-3 py-1.5 text-xs font-semibold hover:bg-brand-action transition-colors">
                Промени парола
              </button>
            </div>
          </div>
          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Бюлетини</h3>
            <p className="text-sm text-gray-700">
              {customer.is_subscribed
                ? "Абонирани сте за нашия бюлетин."
                : "Не сте се абонирал за нашият бюлетин."}
            </p>
            <button
              onClick={() => onSectionChange(ProfileSection.Newsletter)}
              className="bg-brand-action-light text-white px-3 h-7 text-xs font-semibold hover:bg-brand-action transition-colors mt-3"
            >
              Редактирай
            </button>
          </div>
        </div>
      </section>

      {/* Address Book */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Адресна книга
          </h2>
          <button
            onClick={() => onSectionChange(ProfileSection.Addresses)}
            className="bg-brand-action-light text-white px-3 py-1.5 text-xs font-semibold hover:bg-brand-action transition-colors"
          >
            Управление на адреси
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Адрес за фактуриране
            </h3>
            <AddressBlock address={defaultBilling} />
            {defaultBilling && (
              <button
                onClick={() => onSectionChange(ProfileSection.Addresses)}
                className="bg-brand-action-light text-white px-3 h-7 text-xs font-semibold hover:bg-brand-action transition-colors mt-3"
              >
                Промени адрес
              </button>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Адрес за доставка по подразбиране
            </h3>
            <AddressBlock address={defaultShipping} />
            {defaultShipping && (
              <button
                onClick={() => onSectionChange(ProfileSection.Addresses)}
                className="bg-brand-action-light text-white px-3 h-7 text-xs font-semibold hover:bg-brand-action transition-colors mt-3"
              >
                Промени адрес
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Recent Orders */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Последни поръчки
          </h2>
          <Link href="/sales/order/history" className="bg-brand-action-light text-white px-3 h-7 text-xs font-semibold hover:bg-brand-action transition-colors inline-flex items-center justify-center">
            Виж всички
          </Link>
        </div>
        {ordersLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-10 h-10 animate-spin text-brand-action" />
          </div>
        ) : recentOrders.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Нямате поръчки.</p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden flex flex-col gap-3">
              {recentOrders.map((order) => {
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
                    <th className="text-left py-2 pr-4 font-semibold text-gray-600">До</th>
                    <th className="text-left py-2 pr-4 font-semibold text-gray-600">Поръчка общо вкл. ДДС</th>
                    <th className="text-left py-2 pr-4 font-semibold text-gray-600">Статус</th>
                    <th className="text-left py-2 font-semibold text-gray-600">Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.entity_id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 text-gray-500">{order.increment_id}</td>
                      <td className="py-3 pr-4">{formatDate(order.created_at)}</td>
                      <td className="py-3 pr-4">{getShipTo(order)}</td>
                      <td className="py-3 pr-4">{formatCurrency(order.grand_total, order.order_currency_code)}</td>
                      <td className="py-3 pr-4">{ORDER_STATUS[order.status] ?? order.status}</td>
                      <td className="py-3 flex gap-2 flex-wrap">
                        <button
                          onClick={() => router.push(`/sales/order/view/order_id/${order.entity_id}`)}
                          className="bg-brand-action-light text-white px-3 py-1.5 text-xs font-semibold hover:bg-brand-action transition-colors"
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
          </>
        )}
      </section>
    </div>
  );
};
