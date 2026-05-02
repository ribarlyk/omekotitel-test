"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { CustomerAddress } from "@/src/app/types/customer";

interface AddressFormData {
  firstname: string;
  lastname: string;
  company: string;
  telephone: string;
  street: string[];
  vat_id: string;
  city: string;
  region: string;
  postcode: string;
  country_code: string;
  default_billing: boolean;
  default_shipping: boolean;
}

interface Props {
  initial?: CustomerAddress;
  addressId?: number;
}

const empty: AddressFormData = {
  firstname: "",
  lastname: "",
  company: "",
  telephone: "",
  street: ["", "", ""],
  vat_id: "",
  city: "",
  region: "",
  postcode: "",
  country_code: "BG",
  default_billing: false,
  default_shipping: false,
};

function toFormData(a: CustomerAddress): AddressFormData {
  const streets = [...(a.street ?? [])];
  while (streets.length < 3) streets.push("");
  return {
    firstname: a.firstname,
    lastname: a.lastname,
    company: "",
    telephone: a.telephone,
    street: streets,
    vat_id: "",
    city: a.city,
    region: a.region?.region ?? "",
    postcode: a.postcode,
    country_code: a.country_code,
    default_billing: a.default_billing,
    default_shipping: a.default_shipping,
  };
}

export const AddressForm = ({ initial, addressId }: Props) => {
  const router = useRouter();
  const [form, setForm] = useState<AddressFormData>(initial ? toFormData(initial) : empty);
  const [saving, setSaving] = useState(false);

  const set = (field: keyof AddressFormData, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  const setStreet = (i: number, value: string) =>
    setForm((f) => {
      const street = [...f.street];
      street[i] = value;
      return { ...f, street };
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const input = {
      firstname: form.firstname,
      lastname: form.lastname,
      company: form.company || undefined,
      telephone: form.telephone,
      street: form.street.filter(Boolean),
      city: form.city,
      region: form.region ? { region: form.region } : undefined,
      postcode: form.postcode,
      country_code: form.country_code,
      default_billing: form.default_billing,
      default_shipping: form.default_shipping,
    };

    try {
      const url = addressId
        ? `/api/customer/address/${addressId}`
        : "/api/customer/address";
      const method = addressId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Грешка при запис на адрес.");
        return;
      }

      toast.success(addressId ? "Адресът е обновен." : "Адресът е добавен.");
      router.push("/customer/account?section=addresses");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-brand-nav";
  const labelClass = "text-sm text-gray-700 sm:text-right sm:pr-4 sm:leading-9 pb-0.5";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Contact info */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Информация за контакт</h2>
        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-y-2 sm:gap-y-3 sm:items-center max-w-2xl">
          <label className={labelClass}>
            Име <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="text"
            value={form.firstname}
            onChange={(e) => set("firstname", e.target.value)}
            className={inputClass}
          />

          <label className={labelClass}>
            Фамилия <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="text"
            value={form.lastname}
            onChange={(e) => set("lastname", e.target.value)}
            className={inputClass}
          />

          <label className={labelClass}>Фирма</label>
          <input
            type="text"
            value={form.company}
            onChange={(e) => set("company", e.target.value)}
            className={inputClass}
          />

          <label className={labelClass}>
            Телефон <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="tel"
            value={form.telephone}
            onChange={(e) => set("telephone", e.target.value)}
            className={inputClass}
          />
        </div>
      </section>

      {/* Address */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Адрес</h2>
        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-y-2 sm:gap-y-3 sm:items-center max-w-2xl">
          <label className={labelClass}>
            Адрес на получател или офис на куриер
          </label>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={form.street[0]}
              onChange={(e) => setStreet(0, e.target.value)}
              className={inputClass}
            />
            <input
              type="text"
              value={form.street[1]}
              onChange={(e) => setStreet(1, e.target.value)}
              className={inputClass}
            />
            <input
              type="text"
              value={form.street[2]}
              onChange={(e) => setStreet(2, e.target.value)}
              className={inputClass}
            />
          </div>

          <label className={labelClass}>Данни за фактура: Въведете ДДС номер</label>
          <input
            type="text"
            value={form.vat_id}
            onChange={(e) => set("vat_id", e.target.value)}
            className={inputClass}
          />

          <label className={labelClass}>
            Град <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="text"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            className={inputClass}
          />

          <label className={labelClass}>Област / Провинция</label>
          <input
            type="text"
            value={form.region}
            onChange={(e) => set("region", e.target.value)}
            className={inputClass}
          />

          <label className={labelClass}>
            Пощенски код <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="text"
            value={form.postcode}
            onChange={(e) => set("postcode", e.target.value)}
            className={inputClass}
          />

          <label className={labelClass}>
            Държава <span className="text-red-500">*</span>
          </label>
          <select
            value={form.country_code}
            onChange={(e) => set("country_code", e.target.value)}
            className={`${inputClass} bg-white`}
          >
            <option value="BG">България</option>
          </select>

          <div className="hidden sm:block" />
          <div className="flex flex-col gap-2 mt-1">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.default_billing}
                onChange={(e) => set("default_billing", e.target.checked)}
                className="w-4 h-4 accent-brand-action"
              />
              Използвай като моя адрес по подразбиране адрес за фактуриране
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.default_shipping}
                onChange={(e) => set("default_shipping", e.target.checked)}
                className="w-4 h-4 accent-brand-action"
              />
              Използвайте като моя адрес по подразбиране адрес за доставка
            </label>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 max-w-2xl border-t border-gray-200 pt-6">
        <button
          type="submit"
          disabled={saving}
          className="bg-brand-action-light text-white font-bold uppercase text-sm px-10 py-3 hover:bg-brand-action transition-colors cursor-pointer disabled:opacity-50 w-full md:w-auto"
        >
          {saving ? "Запазване..." : "Запиши адрес"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/customer/account?section=addresses")}
          className="text-sm text-brand-action hover:underline text-left"
        >
          Върни се назад
        </button>
      </div>
    </form>
  );
};
