"use client";

import { useState } from "react";
import { toast } from "sonner";
import TurnstileWidget from "@/src/app/components/Turnstile";

const BASE_INPUT = "w-full border border-gray-300 focus:border-brand-nav rounded px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none transition-colors";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [cfToken, setCfToken] = useState<string | null>(null);

  const canSubmit = name.trim() && email.trim() && comment.trim() && !!cfToken;

  const onSubmit: React.ComponentProps<"form">["onSubmit"] = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), telephone: telephone.trim() || undefined, comment: comment.trim(), cfToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Изпращането не успя. Опитайте отново.");
      } else {
        toast.success("Съобщението е изпратено успешно! Ще се свържем с Вас скоро.");
        setName(""); setEmail(""); setTelephone(""); setComment(""); setCfToken(null);
      }
    } catch {
      toast.error("Изпращането не успя. Опитайте отново.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="relative">
        <input
          type="text"
          placeholder="Име"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={BASE_INPUT}
        />
        <span className="absolute top-3 right-3 text-red-500 text-xs">*</span>
      </div>

      <div className="relative">
        <input
          type="email"
          placeholder="Имейл"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={BASE_INPUT}
        />
        <span className="absolute top-3 right-3 text-red-500 text-xs">*</span>
      </div>

      <input
        type="tel"
        placeholder="Телефон"
        value={telephone}
        onChange={(e) => setTelephone(e.target.value)}
        className={BASE_INPUT}
      />

      <div className="relative">
        <textarea
          placeholder="Какво мислите?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          rows={5}
          className={`resize-y ${BASE_INPUT}`}
        />
        <span className="absolute top-3 right-3 text-red-500 text-xs">*</span>
      </div>

      <TurnstileWidget onSuccess={setCfToken} onExpire={() => setCfToken(null)} onError={() => setCfToken(null)} />

      <div>
        <button
          type="submit"
          disabled={!canSubmit || loading}
          className={`px-8 py-3 rounded text-sm font-bold tracking-widest uppercase transition-colors flex items-center gap-2 ${
            canSubmit && !loading
              ? "bg-brand-action text-white hover:opacity-90 cursor-pointer"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-gray-400/30 border-t-gray-600 animate-spin" />
              Изпращане...
            </>
          ) : (
            "Изпрати"
          )}
        </button>
      </div>
    </form>
  );
}
