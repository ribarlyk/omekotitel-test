"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  firstname: string;
  lastname: string;
  email: string;
}

export const ProfileEdit = ({ firstname, lastname, email }: Props) => {
  const router = useRouter();

  const [first, setFirst] = useState(firstname);
  const [last, setLast] = useState(lastname);
  const [changeEmail, setChangeEmail] = useState(false);
  const [changePassword, setChangePassword] = useState(false);

  const [newEmail, setNewEmail] = useState(email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (changePassword && newPassword !== confirmPassword) {
      toast.error("Паролите не съвпадат.");
      return;
    }
    if ((changeEmail || changePassword) && !currentPassword) {
      toast.error("Въведете текущата си парола.");
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = { firstname: first, lastname: last };
      if (changeEmail) body.email = newEmail;
      if (changeEmail || changePassword) body.currentPassword = currentPassword;
      if (changePassword) body.newPassword = newPassword;

      const res = await fetch("/api/customer/account/edit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Грешка при запис.");
        return;
      }

      toast.success("Профилът е обновен.");
      window.location.href = "/customer/account";
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-brand-nav";

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Информация за профила</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Name fields */}
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Първо Име <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={first}
                onChange={(e) => setFirst(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Фамилия <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={last}
                onChange={(e) => setLast(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Toggle checkboxes */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={changeEmail}
                onChange={(e) => setChangeEmail(e.target.checked)}
                className="w-4 h-4 accent-brand-action"
              />
              Промяна на имейл адрес
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={changePassword}
                onChange={(e) => setChangePassword(e.target.checked)}
                className="w-4 h-4 accent-brand-action"
              />
              Промяна на парола
            </label>
          </div>

          {/* Change email fields */}
          {changeEmail && (
            <div className="flex flex-col gap-3 border-t border-gray-200 pt-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Нов имейл адрес <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  autoComplete="email"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Change password fields */}
          {changePassword && (
            <div className="flex flex-col gap-3 border-t border-gray-200 pt-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Нова парола <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Потвърди нова парола <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Current password (shown when either toggle is on) */}
          {(changeEmail || changePassword) && (
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm text-gray-700 mb-1">
                Текуща парола <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className={inputClass}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-t border-gray-200 pt-6">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-action-light text-white font-bold uppercase text-sm px-10 py-3 hover:bg-brand-action transition-colors cursor-pointer disabled:opacity-50 w-full md:w-auto"
            >
              {saving ? "Запазване..." : "Запази"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/customer/account")}
              className="text-sm text-brand-action hover:underline"
            >
              Обратно
            </button>
          </div>
      </form>
    </div>
  );
};
