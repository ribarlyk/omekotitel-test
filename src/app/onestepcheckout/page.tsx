"use client";

import { useState, useEffect, useRef, useOptimistic, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import RevolutCheckout from "@revolut/checkout";
import { useRouter } from "next/navigation";
import { useCart } from "@/src/app/contexts/CartContext";
import { Loader2, ChevronDown, ChevronUp, Plus, Minus, Trash2, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { magentoImageUrl } from "@/src/app/utils/image";
import debounce from "lodash/debounce";
import { toast } from "sonner";

// ─── Form schema ──────────────────────────────────────────────────────────────
const addressSchema = z.object({
  email:     z.string().min(1, "Въведете имейл").email("Невалиден имейл адрес"),
  firstname: z.string().min(1, "Въведете ime"),
  lastname:  z.string().min(1, "Въведете фамилия"),
  telephone: z.string().min(6, "Въведете телефон"),
  street:    z.string().min(1, "Въведете адрес"),
  city:      z.string().min(1, "Въведете град"),
  postcode:  z.string().min(1, "Въведете пощенски код"),
  region:    z.string().min(1, "Въведете област"),
});
type AddressFields = z.infer<typeof addressSchema>;

const FORM_KEY = "checkout_form";

function getStoredForm(): Partial<AddressFields> {
  if (typeof window === "undefined") return {};
  try {
    const s = sessionStorage.getItem(FORM_KEY);
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
}

interface ShippingAddress {
  firstname: string;
  lastname: string;
  telephone: string;
  street: string;
  city: string;
  postcode: string;
  region: string;
  country_code: string;
}

interface ShippingMethod {
  carrier_code: string;
  method_code: string;
  carrier_title: string;
  method_title: string;
  amount: { value: number; currency: string };
}

interface PaymentMethod {
  code: string;
  title: string;
}

// ─── Shared input styles ──────────────────────────────────────────────────────
const inputBase =
  "w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:border-brand-action focus:ring-2 focus:ring-brand-action/20 hover:border-gray-300";

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-brand-action ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-7 h-7 rounded-full bg-brand-nav flex items-center justify-center text-xs font-bold text-white shrink-0">
        {number}
      </div>
      <h2 className="font-semibold text-gray-900 text-base">{title}</h2>
    </div>
  );
}

function CheckoutProgress({
  contactValid,
  shippingValid,
  shippingSelected,
  billingValid,
  paymentDone,
}: {
  contactValid: boolean;
  shippingValid: boolean;
  shippingSelected: boolean;
  billingValid: boolean;
  paymentDone: boolean;
}) {
  const steps = [
    { label: "Контакти", done: contactValid },
    { label: "Адрес", done: shippingValid },
    { label: "Фактуриране", done: billingValid },
    { label: "Доставка", done: shippingSelected },
    { label: "Плащане", done: paymentDone },
  ];
  const currentStep = steps.findIndex((s) => !s.done);

  return (
    <div className="flex items-start mb-6 w-full">
      {steps.map((step, i) => (
        <div key={i} className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}>
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold border-2 transition-all ${
                step.done
                  ? "bg-brand-action border-brand-action text-white"
                  : currentStep === i
                  ? "border-brand-action text-brand-action bg-white"
                  : "border-gray-200 text-gray-400 bg-white"
              }`}
            >
              {step.done ? <Check size={10} strokeWidth={3} className="sm:hidden" /> : null}
              {step.done ? <Check size={13} strokeWidth={3} className="hidden sm:block" /> : null}
              {!step.done && i + 1}
            </div>
            <span
              className={`text-[9px] sm:text-xs whitespace-nowrap ${
                step.done || currentStep === i
                  ? "text-gray-700 font-medium"
                  : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-0.5 flex-1 mx-1 sm:mx-1.5 mb-4 sm:mb-5 transition-all ${
                step.done ? "bg-brand-action" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function SectionTeaser({ number, title, rows = 2 }: { number: string; title: string; rows?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 select-none">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
          {number}
        </div>
        <h2 className="font-semibold text-gray-300 text-base">{title}</h2>
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-50 rounded-xl border border-gray-100" />
        ))}
      </div>
    </div>
  );
}

// ─── Quantity input (reused from CartPanel) ───────────────────────────────────
function QuantityInput({
  id,
  quantity,
  isUpdating,
  onUpdate,
}: {
  id: string;
  quantity: number;
  isUpdating: boolean;
  onUpdate: (id: string, qty: number) => void;
}) {
  const [value, setValue] = useState(String(quantity));

  useEffect(() => { setValue(String(quantity)); }, [quantity]);

  const debouncedUpdate = useRef(
    debounce((itemId: string, qty: number) => onUpdate(itemId, qty), 600)
  ).current;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setValue(raw);
    const num = parseInt(raw);
    if (!isNaN(num) && num >= 1) {
      if (num > 99) {
        toast.warning("За количества над 99 бр. моля обадете се на 0888787852 за наличност.");
        return;
      }
      debouncedUpdate(id, num);
    }
  };

  const handleBlur = () => {
    debouncedUpdate.flush();
    const num = parseInt(value);
    if (isNaN(num) || num < 1) setValue(String(quantity));
  };

  if (isUpdating) return <Loader2 size={13} className="animate-spin text-brand-action" />;

  return (
    <input
      type="number"
      min={1}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      className="w-7 text-center text-sm text-brand-nav font-medium leading-none bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  );
}

// ─── Order summary (mobile collapsible / desktop always visible) ──────────────
function OrderSummary({ shippingCost }: { shippingCost?: number }) {
  const { cart, loading: cartLoading, removeFromCart, updateQuantity } = useCart();
  const [optimisticItems, updateOptimisticItems] = useOptimistic(
    cart?.items ?? [],
    (state, { id, quantity }: { id: string; quantity: number }) =>
      state.map((item) => (item.id === id ? { ...item, quantity } : item))
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      await removeFromCart(id);
      toast.success("Продуктът е премахнат от количката ви");
    } catch {
      toast.error("Грешка при премахване");
    } finally {
      setRemovingId(null);
    }
  };

  const handleUpdateQuantity = (id: string, qty: number) => {
    setUpdatingId(id);
    startTransition(async () => {
      updateOptimisticItems({ id, quantity: qty });
      try {
        await updateQuantity(id, qty);
        toast.success("Количката е обновена");
      } catch {
        toast.error("Грешка при обновяване");
      } finally {
        setUpdatingId(null);
      }
    });
  };

  const total = cart?.prices.grand_total;
  const subtotal = cart?.prices.subtotal_excluding_tax;

  return (
    <div className="space-y-4">
      {cartLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-14 h-14 bg-gray-100 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ul className="space-y-3">
          {optimisticItems.filter((item) => item.product).map((item) => {
            const price = item.product.price_range.minimum_price.final_price;
            return (
              <li key={item.id} className="flex gap-3 items-start">
                <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                  <Image
                    src={magentoImageUrl(item.product.thumbnail.url)}
                    alt={item.product.thumbnail.label || item.product.name}
                    fill
                    sizes="80px"
                    className="object-contain p-1"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base text-gray-700 line-clamp-2 leading-snug mb-1.5">
                    {item.product.name}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center rounded-full overflow-hidden select-none border border-brand-action-light">
                      <div
                        onClick={() => item.quantity > 1 && updatingId !== item.id && handleUpdateQuantity(item.id, item.quantity - 1)}
                        className={`w-7 h-7 flex items-center justify-center bg-brand-action-light text-white hover:bg-brand-action transition-colors cursor-pointer ${item.quantity <= 1 || updatingId === item.id ? "opacity-30 pointer-events-none" : ""}`}
                      >
                        <Minus size={12} />
                      </div>
                      <span className="w-7 h-7 flex items-center justify-center">
                        <QuantityInput
                          id={item.id}
                          quantity={item.quantity}
                          isUpdating={updatingId === item.id}
                          onUpdate={handleUpdateQuantity}
                        />
                      </span>
                      <div
                        onClick={() => updatingId !== item.id && handleUpdateQuantity(item.id, item.quantity + 1)}
                        className={`w-7 h-7 flex items-center justify-center bg-brand-action-light text-white hover:bg-brand-action transition-colors cursor-pointer ${updatingId === item.id ? "opacity-30 pointer-events-none" : ""}`}
                      >
                        <Plus size={12} />
                      </div>
                    </div>
                    <p className="text-base font-semibold text-gray-900 shrink-0">
                      {(price.value * item.quantity).toFixed(2)}&nbsp;{price.currency}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(item.id)}
                  disabled={removingId === item.id}
                  className="text-gray-300 hover:text-red-400 cursor-pointer shrink-0 disabled:cursor-not-allowed mt-0.5"
                  aria-label="Премахни"
                >
                  {removingId === item.id
                    ? <Loader2 size={15} className="animate-spin text-brand-action" />
                    : <Trash2 size={15} />
                  }
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-gray-100 pt-4 space-y-2">
        <div className="flex justify-between text-base text-gray-500">
          <span>Междинна сума</span>
          <span>
            {subtotal?.value.toFixed(2)}&nbsp;{subtotal?.currency}
          </span>
        </div>
        {shippingCost !== undefined && (
          <div className="flex justify-between text-base text-gray-500">
            <span>Доставка</span>
            <span>
              {shippingCost === 0
                ? "Безплатна"
                : `${shippingCost.toFixed(2)} лв`}
            </span>
          </div>
        )}
        <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100">
          <span>Общо</span>
          <span>
            {total?.value.toFixed(2)}&nbsp;{total?.currency}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Method radio ─────────────────────────────────────────────────────────────
function MethodRadio({
  name,
  value,
  checked,
  onChange,
  label,
  sublabel,
  price,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  sublabel?: string;
  price?: string;
}) {
  return (
    <label
      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
        checked
          ? "border-brand-action bg-brand-action/5 shadow-sm"
          : "border-gray-200 hover:border-gray-300 bg-white"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="accent-brand-action w-4 h-4 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {sublabel && <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>}
      </div>
      {price !== undefined && (
        <span className="text-sm font-semibold text-gray-900 shrink-0">{price}</span>
      )}
    </label>
  );
}

// ─── Methods skeleton ─────────────────────────────────────────────────────────
function MethodsSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="h-14 bg-gray-100 rounded-xl" />
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading: cartLoading, itemCount, refreshCart } = useCart();

  const {
    register,
    watch: watchForm,
    getValues: getShipping,
    reset,
    formState: { errors: shippingErrors },
  } = useForm<AddressFields>({
    resolver: zodResolver(addressSchema),
    mode: "onChange",
    defaultValues: {
      email: "", firstname: "", lastname: "", telephone: "",
      street: "", city: "", postcode: "", region: "",
    },
  });

  // Restore sessionStorage after hydration to avoid server/client HTML mismatch
  useEffect(() => {
    const stored = getStoredForm();
    if (Object.keys(stored).length > 0) {
      reset({ email: "", firstname: "", lastname: "", telephone: "", street: "", city: "", postcode: "", region: "", ...stored }, { keepErrors: false });
    }
    setFormRestoring(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Derive validity from watched values so it updates on every keystroke
  const watchedValues = watchForm();
  const contactValid =
    !!watchedValues.email?.trim() &&
    watchedValues.email.includes("@") &&
    !!watchedValues.telephone?.trim() &&
    watchedValues.telephone.trim().length >= 6;
  const shippingValid =
    contactValid &&
    !!watchedValues.firstname?.trim() &&
    !!watchedValues.lastname?.trim() &&
    !!watchedValues.street?.trim() &&
    !!watchedValues.city?.trim() &&
    !!watchedValues.postcode?.trim() &&
    !!watchedValues.region?.trim();

  // Persist form to sessionStorage on every change
  useEffect(() => {
    const sub = watchForm((values) => {
      try { sessionStorage.setItem(FORM_KEY, JSON.stringify(values)); } catch {}
    });
    return () => sub.unsubscribe();
  }, [watchForm]);

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("");
  const [methodsLoading, setMethodsLoading] = useState(false);

  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingAddress, setBillingAddress] = useState<ShippingAddress>({
    firstname: "", lastname: "", street: "", city: "", region: "",
    postcode: "", country_code: "BG", telephone: "",
  });
  // Derived shipping address — exclude email (not a shipping address field)
  const { email, ...addressFields } = getShipping();
  const shippingAddress: ShippingAddress = { ...addressFields, country_code: "BG" };

  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);

  // ── Revolut Pay state ────────────────────────────────────────────────────────
  const [revolutPublicId, setRevolutPublicId] = useState<string | null>(null);
  const [revolutOrderId, setRevolutOrderId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [revolutModule, setRevolutModule] = useState<any>(null);
  // Callback ref — React sets this when the container div is committed to the DOM
  const [revolutContainer, setRevolutContainer] = useState<HTMLDivElement | null>(null);

  // Form restoring from sessionStorage (avoids flash of empty inputs on mount/Revolut redirect)
  const [formRestoring, setFormRestoring] = useState(true);

  // Mobile order summary toggle
  const [summaryOpen, setSummaryOpen] = useState(true);

  // ── Init Revolut SDK eagerly as soon as we know revolut_pay is available ────
  useEffect(() => {
    if (!paymentMethods.find((m) => m.code === "revolut_pay")) return;
    if (revolutModule) return;
    const publicToken = process.env.NEXT_PUBLIC_REVOLUT_PUBLIC_KEY;
    if (!publicToken) return;
    RevolutCheckout.payments({
      publicToken,
      locale: "bg",
      mode: process.env.NEXT_PUBLIC_REVOLUT_ENV === "sandbox" ? "sandbox" : "prod",
    }).then(setRevolutModule).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethods]);

  // ── Mount widget — fires only once React has committed the container to the DOM
  useEffect(() => {
    if (!cart || !revolutModule || !revolutContainer) return;

    let capturedPublicId: string | null = null;
    let capturedOrderId: string | null = null;

    revolutModule.revolutPay.on("payment", (payload: { type: string; error?: { message?: string } }) => {
      if (payload.type === "success") {
        let publicId = capturedPublicId;
        let orderId = capturedOrderId;
        if (!publicId) {
          try {
            const saved = sessionStorage.getItem("revolut_checkout_state");
            if (saved) {
              const parsed = JSON.parse(saved);
              publicId = parsed.pendingPublicId ?? null;
              orderId = parsed.pendingOrderId ?? null;
            }
          } catch {}
        }
        try { sessionStorage.removeItem("revolut_checkout_state"); } catch {}
        setRevolutPublicId(publicId);
        setRevolutOrderId(orderId);
      } else if (payload.type === "error") {
        setPlaceError(payload.error?.message ?? "Грешка при Revolut плащането");
      } else if (payload.type === "cancel") {
        setRevolutPublicId(null);
        setRevolutOrderId(null);
        try { sessionStorage.removeItem("revolut_checkout_state"); } catch {}
      }
    });

    revolutModule.revolutPay.mount(revolutContainer, {
      currency: cart.prices.grand_total.currency,
      totalAmount: Math.round(cart.prices.grand_total.value * 100),
      redirectUrl: window.location.href,
      createOrder: async () => {
        try {
          sessionStorage.setItem("revolut_checkout_state", JSON.stringify({
            shippingAddress,
            billingAddress,
            billingSameAsShipping,
            selectedPayment: "revolut_pay",
          }));
        } catch {}
        const res = await fetch("/api/checkout/revolut-order", { method: "POST", credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? "Грешка при стартиране на Revolut");
        capturedPublicId = data.publicId as string;
        capturedOrderId = data.orderId as string;
        try {
          const existing = JSON.parse(sessionStorage.getItem("revolut_checkout_state") ?? "{}");
          sessionStorage.setItem("revolut_checkout_state", JSON.stringify({
            ...existing,
            pendingPublicId: capturedPublicId,
            pendingOrderId: capturedOrderId,
          }));
        } catch {}
        return { publicId: capturedPublicId };
      },
    } as Parameters<typeof revolutModule.revolutPay.mount>[1]);

    return () => { try { revolutModule.revolutPay.destroy(); } catch {} };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, revolutModule, revolutContainer]);

  // ── Auto-place order the moment Revolut payment succeeds ────────────────────
  useEffect(() => {
    if (!revolutPublicId || selectedPayment !== "revolut_pay" || placing) return;
    handlePlaceOrder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revolutPublicId]);

  // ── Load everything on mount — no form dependency ────────────────────────────
  const DEFAULT_BG_ADDRESS: ShippingAddress = {
    firstname: "Customer", lastname: "Customer",
    street: "ул. Витоша 1", city: "София",
    region: "София", postcode: "1000",
    country_code: "BG", telephone: "0888000000",
  };

  useEffect(() => {
    function applyMethodsData(data: { shippingMethods?: ShippingMethod[]; paymentMethods?: PaymentMethod[] }) {
      const shipping: ShippingMethod[] = data.shippingMethods ?? [];
      const payment: PaymentMethod[] = data.paymentMethods ?? [];
      setShippingMethods(shipping);
      setPaymentMethods(payment);
      // No default — user must explicitly choose a shipping method
      if (payment.length > 0) {
        let savedPayment: string | null = null;
        try {
          const saved = sessionStorage.getItem("revolut_checkout_state");
          if (saved) savedPayment = JSON.parse(saved).selectedPayment ?? null;
        } catch {}
        const preferred = savedPayment ?? (payment.find((m) => m.code === "revolut_pay")?.code ?? payment[0].code);
        setSelectedPayment(preferred);
      }
    }

    // Use data pre-fetched by the CartPanel button if available
    try {
      const cached = sessionStorage.getItem("checkout_prefetch");
      if (cached) {
        sessionStorage.removeItem("checkout_prefetch");
        applyMethodsData(JSON.parse(cached));
        return;
      }
    } catch {}

    // Fallback: fetch directly (e.g. hard refresh or direct URL visit)
    setMethodsLoading(true);
    fetch("/api/checkout/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ shippingAddress: DEFAULT_BG_ADDRESS }),
    })
      .then((r) => r.json())
      .then(applyMethodsData)
      .catch(() => {})
      .finally(() => setMethodsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Shipping cost for summary ───────────────────────────────────────────────
  const selectedShippingMethod = shippingMethods.find(
    (m) => `${m.carrier_code}|${m.method_code}` === selectedShipping
  );

  // ── Place order ─────────────────────────────────────────────────────────────
  async function handlePlaceOrder() {
    setPlaceError(null);
    setPlacing(true);
    try {
      const [carrierCode, methodCode] = selectedShipping.split("|");
      const res = await fetch("/api/checkout/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          shippingAddress,
          shippingMethod: { carrier_code: carrierCode, method_code: methodCode },
          billingAddress: billingSameAsShipping ? shippingAddress : billingAddress,
          paymentMethod: (revolutPublicId && isRevolutPay)
            ? { method: selectedPayment, additional_data: { public_id: revolutPublicId, order_id: revolutOrderId ?? "" } }
            : { method: selectedPayment },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Грешка при поръчката");
      try {
        sessionStorage.removeItem("revolut_checkout_state");
        sessionStorage.removeItem(FORM_KEY);
      } catch {}
      router.push(`/onestepcheckout/success?order=${encodeURIComponent(data.orderNumber)}`);
      await refreshCart();
    } catch (e) {
      setPlaceError(e instanceof Error ? e.message : "Грешка");
    } finally {
      setPlacing(false);
    }
  }

  function updateBilling(field: keyof ShippingAddress, value: string) {
    setBillingAddress((prev) => ({ ...prev, [field]: value }));
  }

  const methodsReady = !methodsLoading && shippingMethods.length > 0;
  const isRevolutPay = selectedPayment === "revolut_pay" || selectedPayment === "revolut_pay_later";
  const billingValid = billingSameAsShipping || (
    billingAddress.firstname.trim() !== "" &&
    billingAddress.lastname.trim() !== "" &&
    billingAddress.telephone.trim().length >= 6 &&
    billingAddress.street.trim() !== "" &&
    billingAddress.city.trim() !== "" &&
    billingAddress.postcode.trim() !== "" &&
    billingAddress.region.trim() !== ""
  );
  const canPlaceOrder =
    shippingValid &&
    billingValid &&
    methodsReady &&
    selectedShipping !== "" &&
    selectedPayment !== "" &&
    (!isRevolutPay || revolutPublicId !== null) &&
    !placing;

  // ── Empty cart guard ────────────────────────────────────────────────────────
  if (!cartLoading && itemCount === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-lg text-gray-600">Количката ви е празна.</p>
        <Link href="/" className="text-brand-nav underline text-sm">
          Към началото
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-clip">
      {/* ── Mobile order summary toggle ── */}
      <div className="lg:hidden bg-white border-b border-gray-100">
        <button
          onClick={() => setSummaryOpen((p) => !p)}
          className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium text-brand-nav"
        >
          <span className="flex items-center gap-2">
            {summaryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {summaryOpen ? "Скрий" : "Покажи"} резюмето на поръчката
          </span>
          <span className="font-bold text-gray-900">
            {cart?.prices.grand_total.value.toFixed(2)}&nbsp;
            {cart?.prices.grand_total.currency}
          </span>
        </button>
        {summaryOpen && (
          <div className="px-4 pb-5 border-t border-gray-100">
            <OrderSummary shippingCost={selectedShippingMethod?.amount.value} />
          </div>
        )}
      </div>

      {/* ── Main layout ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-10 xl:gap-16">
          {/* ══ LEFT: Form ══════════════════════════════════════════════════ */}
          <div className="flex-1 min-w-0 max-w-lg space-y-6">

            <div className="lg:sticky lg:top-40 z-20 bg-gray-50 py-3 -mx-4 sm:-mx-6 px-4 sm:px-6">
              <CheckoutProgress
                contactValid={contactValid}
                shippingValid={shippingValid}
                shippingSelected={shippingValid && selectedShipping !== ""}
                billingValid={shippingValid && billingValid}
                paymentDone={shippingValid && billingValid && selectedPayment !== "" && (!isRevolutPay || !!revolutPublicId)}
              />
            </div>

            {/* 01 · Contact */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <SectionHeader number="01" title="Данни за контакт" />
              {formRestoring ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-11 bg-gray-100 rounded-lg" />
                  <div className="h-11 bg-gray-100 rounded-lg" />
                </div>
              ) : (
                <div className="space-y-4">
                  <Field label="Имейл адрес" required error={shippingErrors.email?.message}>
                    <input
                      type="email"
                      className={inputBase}
                      placeholder="you@example.com"
                      autoComplete="email"
                      {...register("email")}
                    />
                  </Field>
                  <Field label="Телефон" required error={shippingErrors.telephone?.message}>
                    <input type="tel" className={inputBase} placeholder="+359 88 888 8888" autoComplete="tel" {...register("telephone")} />
                  </Field>
                </div>
              )}
            </div>

            {/* 02 · Shipping address */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <SectionHeader number="02" title="Адрес за доставка" />
              {formRestoring ? (
                <div className="space-y-4 animate-pulse">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="h-11 bg-gray-100 rounded-lg" />
                    <div className="h-11 bg-gray-100 rounded-lg" />
                  </div>
                  <div className="h-11 bg-gray-100 rounded-lg" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="h-11 bg-gray-100 rounded-lg" />
                    <div className="h-11 bg-gray-100 rounded-lg" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="h-11 bg-gray-100 rounded-lg" />
                    <div className="h-11 bg-gray-100 rounded-lg" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Име" required error={shippingErrors.firstname?.message}>
                      <input className={inputBase} placeholder="Иван" autoComplete="given-name" {...register("firstname")} />
                    </Field>
                    <Field label="Фамилия" required error={shippingErrors.lastname?.message}>
                      <input className={inputBase} placeholder="Иванов" autoComplete="family-name" {...register("lastname")} />
                    </Field>
                  </div>
                  <Field label="Адрес" required error={shippingErrors.street?.message}>
                    <input className={inputBase} placeholder="ул. Витоша 1" autoComplete="street-address" {...register("street")} />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Град" required error={shippingErrors.city?.message}>
                      <input className={inputBase} placeholder="София" autoComplete="address-level2" {...register("city")} />
                    </Field>
                    <Field label="Пощенски код" required error={shippingErrors.postcode?.message}>
                      <input className={inputBase} placeholder="1000" autoComplete="postal-code" {...register("postcode")} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Област" required error={shippingErrors.region?.message}>
                      <input className={inputBase} placeholder="Софийска" {...register("region")} />
                    </Field>
                    <Field label="Държава">
                      <input className={`${inputBase} bg-gray-50 text-gray-500 cursor-not-allowed`} value="България" readOnly />
                    </Field>
                  </div>
                </div>
              )}
            </div>

            {/* 03-05 */}
            <div className="space-y-6">

            {/* 03 · Billing address */}
            {!shippingValid ? <SectionTeaser number="03" title="Адрес за фактуриране" rows={3} /> :
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <SectionHeader number="03" title="Адрес за фактуриране" />
              <label className="flex items-center gap-3 cursor-pointer group mb-4">
                <div
                  onClick={() => setBillingSameAsShipping((p: boolean) => !p)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                    billingSameAsShipping
                      ? "bg-brand-action border-brand-action"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {billingSameAsShipping && (
                    <svg viewBox="0 0 10 8" className="w-3 h-3 text-white fill-current">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                  Същият като адреса за доставка
                </span>
              </label>

              {!billingSameAsShipping && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Ime" required>
                      <input
                        className={inputBase}
                        value={billingAddress.firstname}
                        onChange={(e) => updateBilling("firstname", e.target.value)}
                        placeholder="Иван"
                      />
                    </Field>
                    <Field label="Фамилия" required>
                      <input
                        className={inputBase}
                        value={billingAddress.lastname}
                        onChange={(e) => updateBilling("lastname", e.target.value)}
                        placeholder="Иванов"
                      />
                    </Field>
                  </div>
                  <Field label="Телефон" required>
                    <input
                      type="tel"
                      className={inputBase}
                      value={billingAddress.telephone}
                      onChange={(e) => updateBilling("telephone", e.target.value)}
                      placeholder="+359 88 888 8888"
                    />
                  </Field>
                  <Field label="Адрес" required>
                    <input
                      className={inputBase}
                      value={billingAddress.street}
                      onChange={(e) => updateBilling("street", e.target.value)}
                      placeholder="ул. Витоша 1"
                    />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Град" required>
                      <input
                        className={inputBase}
                        value={billingAddress.city}
                        onChange={(e) => updateBilling("city", e.target.value)}
                        placeholder="София"
                      />
                    </Field>
                    <Field label="Пощенски код" required>
                      <input
                        className={inputBase}
                        value={billingAddress.postcode}
                        onChange={(e) => updateBilling("postcode", e.target.value)}
                        placeholder="1000"
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Област" required>
                      <input
                        className={inputBase}
                        value={billingAddress.region}
                        onChange={(e) => updateBilling("region", e.target.value)}
                        placeholder="Софийска"
                      />
                    </Field>
                    <Field label="Държава">
                      <input
                        className={`${inputBase} bg-gray-50 text-gray-500 cursor-not-allowed`}
                        value="България"
                        readOnly
                      />
                    </Field>
                  </div>
                </div>
              )}
            </div>}

            {/* 04 · Shipping method */}
            {!shippingValid ? <SectionTeaser number="04" title="Метод на доставка" rows={2} /> :
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <SectionHeader number="04" title="Метод на доставка" />
              {methodsLoading ? (
                <MethodsSkeleton />
              ) : shippingMethods.length > 0 ? (
                <div className="space-y-2">
                  {shippingMethods.map((m) => {
                    const value = `${m.carrier_code}|${m.method_code}`;
                    return (
                      <MethodRadio
                        key={value}
                        name="shippingMethod"
                        value={value}
                        checked={selectedShipping === value}
                        onChange={() => setSelectedShipping(value)}
                        label={`${m.carrier_title} — ${m.method_title}`}
                        price={
                          m.amount.value === 0
                            ? "Безплатна"
                            : `${m.amount.value.toFixed(2)} ${m.amount.currency}`
                        }
                      />
                    );
                  })}
                </div>
              ) : null}
            </div>}

            {/* 05 · Payment method */}
            {!shippingValid ? <SectionTeaser number="05" title="Начин на плащане" rows={2} /> :
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <SectionHeader number="05" title="Начин на плащане" />
              {methodsLoading ? (
                <MethodsSkeleton />
              ) : paymentMethods.length > 0 ? (
                <div className="space-y-2">
                  {paymentMethods.map((m) => (
                    <div key={m.code}>
                      <MethodRadio
                        name="paymentMethod"
                        value={m.code}
                        checked={selectedPayment === m.code}
                        onChange={() => {
                          setSelectedPayment(m.code);
                          setRevolutPublicId(null);
                        }}
                        label={m.code === "revolut_pay" ? "Плащане с карта" : m.title}
                      />

                      {/* Revolut Pay widget — always in DOM, visibility toggled via CSS */}
                      {(m.code === "revolut_pay" || m.code === "revolut_pay_later") && (
                        <div className={`mt-2 ${selectedPayment === m.code ? "block" : "hidden"}`}>
                          {revolutPublicId ? (
                            <div className="flex items-center gap-2 py-3 text-sm text-brand-nav font-medium">
                              <svg viewBox="0 0 16 16" className="w-4 h-4 fill-brand-action shrink-0">
                                <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm3.54 5.46-4.25 4.25-1.83-1.83a.75.75 0 1 0-1.06 1.06l2.36 2.36a.75.75 0 0 0 1.06 0l4.78-4.78a.75.75 0 1 0-1.06-1.06z"/>
                              </svg>
                              Авторизирано — готово за поръчка
                            </div>
                          ) : (
                            <div ref={setRevolutContainer} className="w-full overflow-hidden" />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>}

            {/* Place order — mobile only */}
            <div className="lg:hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              {placeError && (
                <p className="text-sm text-red-500 mb-4">{placeError}</p>
              )}
              <button
                onClick={isRevolutPay ? undefined : handlePlaceOrder}
                disabled={!canPlaceOrder}
                className="w-full flex items-center justify-center gap-2.5 bg-brand-action hover:bg-brand-action-light disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-4 rounded-xl transition-colors text-base shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                {placing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Обработва се…
                  </>
                ) : isRevolutPay && !revolutPublicId ? (
                  "Плащане с карта"
                ) : (
                  "Потвърди поръчката"
                )}
              </button>
              <p className="text-xs text-center text-gray-400 mt-3">
                Като натиснете бутона, приемате нашите{" "}
                <Link href="/terms" className="underline hover:text-gray-600">
                  Общи условия
                </Link>
                .
              </p>
            </div>

            </div>
          </div>

          {/* ══ RIGHT: Order summary (desktop) ══════════════════════════════ */}
          <aside className="max-lg:hidden flex-1 min-w-96 shrink-0 self-start sticky top-40">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <h2 className="font-semibold text-gray-900 text-base mb-5">
                Резюме на поръчката
              </h2>
              <OrderSummary shippingCost={selectedShippingMethod?.amount.value} />
              <div className="border-t border-gray-100 mt-4 pt-4">
              {placeError && (
                <p className="text-sm text-red-500 mb-4">{placeError}</p>
              )}
              <button
                onClick={isRevolutPay ? undefined : handlePlaceOrder}
                disabled={!canPlaceOrder}
                className="w-full flex items-center justify-center gap-2.5 bg-brand-action hover:bg-brand-action-light disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-4 rounded-xl transition-colors text-base shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                {placing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Обработва се…
                  </>
                ) : isRevolutPay && !revolutPublicId ? (
                  "Плащане с карта"
                ) : (
                  "Потвърди поръчката"
                )}
              </button>
              <p className="text-xs text-center text-gray-400 mt-3">
                Като натиснете бутона, приемате нашите{" "}
                <Link href="/terms" className="underline hover:text-gray-600">
                  Общи условия
                </Link>
                .
              </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
