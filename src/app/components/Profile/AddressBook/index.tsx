"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CustomerAddress } from "@/src/app/types/customer";

interface Props {
  addresses: CustomerAddress[];
}

function AddressCard({
  address,
  label,
  editLabel,
  onDelete,
}: {
  address: CustomerAddress;
  label: string;
  editLabel: string;
  onDelete: (id: number) => void;
}) {
  const router = useRouter();
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{label}</h3>
      <div className="text-sm text-gray-700 leading-6">
        <p>{address.firstname} {address.lastname}</p>
        {address.street.map((line, i) => line && <p key={i}>{line}</p>)}
        <p>
          {address.city}
          {address.region?.region ? `, ${address.region.region}` : ""}, {address.postcode}
        </p>
        <p>България</p>
        <p>T: {address.telephone}</p>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        <button
          onClick={() => router.push(`/customer/address/${address.id}`)}
          className="bg-brand-action-light text-white px-3 py-1.5 text-xs font-semibold hover:bg-brand-action transition-colors"
        >
          {editLabel}
        </button>
        <button
          onClick={() => onDelete(address.id)}
          className="bg-brand-action-light text-white px-3 py-1.5 text-xs font-semibold hover:bg-brand-action transition-colors"
        >
          Изтриване на адрес
        </button>
      </div>
    </div>
  );
}

export const AddressBook = ({ addresses }: Props) => {
  const router = useRouter();

  const defaultBilling = addresses.find((a) => a.default_billing);
  const defaultShipping = addresses.find((a) => a.default_shipping);
  const additional = addresses.filter((a) => !a.default_billing && !a.default_shipping);

  const handleDelete = async (id: number) => {
    if (!confirm("Сигурни ли сте, че искате да изтриете този адрес?")) return;
    const res = await fetch(`/api/customer/address?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Адресът е изтрит.");
      router.refresh();
    } else {
      toast.error("Грешка при изтриване на адрес.");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Адресна книга</h1>
      </div>

        {/* Default addresses */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
            Адреси по подразбиране
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {defaultBilling ? (
              <AddressCard
                address={defaultBilling}
                label="Адрес за фактуриране"
                editLabel="Промяна на адрес за фактуриране"
                onDelete={handleDelete}
              />
            ) : (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  По подразбиране адрес за фактуриране
                </h3>
                <p className="text-sm text-gray-500 italic">Няма зададен адрес.</p>
              </div>
            )}

            {defaultShipping ? (
              <AddressCard
                address={defaultShipping}
                label="Адрес за доставка по подразбиране"
                editLabel="Промяна на адрес за доставка"
                onDelete={handleDelete}
              />
            ) : (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Адрес за доставка по подразбиране
                </h3>
                <p className="text-sm text-gray-500 italic">Няма зададен адрес.</p>
              </div>
            )}
          </div>
        </section>

        {/* Additional addresses */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
            Допълнителни адресни записи
          </h2>
          {additional.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              Нямате други адресни записи във вашата адресна книга.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {additional.map((a) => (
                <AddressCard
                  key={a.id}
                  address={a}
                  label={`${a.firstname} ${a.lastname}`}
                  editLabel="Редактирай адрес"
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-t border-gray-200 pt-6">
          <button
            onClick={() => router.push("/customer/address/new")}
            className="bg-brand-action-light text-white font-bold uppercase text-sm px-10 py-3 hover:bg-brand-action transition-colors cursor-pointer w-full md:w-auto"
          >
            Добави нов адрес
          </button>
          <button
            onClick={() => router.push("/customer/account")}
            className="text-sm text-brand-action hover:underline text-left"
          >
            Обратно
          </button>
        </div>
    </div>
  );
};
