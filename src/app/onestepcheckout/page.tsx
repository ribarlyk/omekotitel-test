"use client";

import {
  useState,
  useEffect,
  useRef,
  useOptimistic,
  useTransition,
  startTransition,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import RevolutCheckout from "@revolut/checkout";
import { useRouter } from "next/navigation";
import { useCart } from "@/src/app/contexts/CartContext";
import {
  Loader2,
  Plus,
  Minus,
  Trash2,
  Check,
  ShieldCheck,
} from "lucide-react";
import { CourierOfficeSelector, prefetchOffices } from "@/src/app/components/CourierOfficeSelector";
import Link from "next/link";
import MagentoImage from "@/src/app/components/MagentoImage";
import { magentoImageUrl } from "@/src/app/utils/image";
import debounce from "lodash/debounce";
import { toast } from "sonner";
import TurnstileWidget from "@/src/app/components/Turnstile";

// ─── Form schema ──────────────────────────────────────────────────────────────
const addressSchema = z.object({
  email: z.string().min(1, "Въведете имейл").email("Невалиден имейл адрес"),
  firstname: z.string().min(1, "Въведете име"),
  lastname: z.string().min(1, "Въведете фамилия"),
  telephone: z.string().min(6, "Въведете телефон"),
  street: z.string().min(1, "Въведете адрес"),
  city: z.string().min(1, "Въведете град"),
  postcode: z.string().min(1, "Въведете пощенски код"),
  region: z.string().min(1, "Въведете област"),
});
type AddressFields = z.infer<typeof addressSchema>;

const FORM_KEY = "checkout_form";

function getStoredForm(): Partial<AddressFields> {
  if (typeof window === "undefined") return {};
  try {
    const s = sessionStorage.getItem(FORM_KEY);
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
}

interface ShippingAddress {
  firstname: string;
  lastname: string;
  telephone: string;
  street: string | string[];
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

function SectionHeader({ number, title, loading }: { number: string; title: string; loading?: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-7 h-7 rounded-full bg-brand-nav flex items-center justify-center text-xs font-bold text-white shrink-0">
        {number}
      </div>
      <h2 className="font-semibold text-gray-900 text-base">{title}</h2>
      {loading && <Loader2 size={15} className="animate-spin text-gray-400" />}
    </div>
  );
}

function CheckoutProgress({
  contactValid,
  shippingSelected,
  shippingValid,
  addressSkipped,
  billingValid,
  paymentDone,
}: {
  contactValid: boolean;
  shippingSelected: boolean;
  shippingValid: boolean;
  addressSkipped: boolean;
  billingValid: boolean;
  paymentDone: boolean;
}) {
  const steps = [
    { label: "Контакти", done: contactValid },
    { label: "Доставка", done: shippingSelected },
    { label: "Адрес", done: shippingValid, skipped: addressSkipped },
    { label: "Фактуриране", done: billingValid },
    { label: "Плащане", done: paymentDone },
  ];
  const currentStep = steps.findIndex((s) => !s.done);

  return (
    <div className="flex items-start mb-6 w-full">
      {steps.map((step, i) => (
        <div key={i} className="flex-1 flex flex-col items-center relative">
          {i > 0 && (
            <div
              className={`absolute top-3 sm:top-4 right-1/2 left-0 h-0.5 transition-all ${
                steps[i - 1].done || steps[i - 1].skipped
                  ? "bg-brand-action"
                  : "bg-gray-200"
              }`}
            />
          )}
          {i < steps.length - 1 && (
            <div
              className={`absolute top-3 sm:top-4 left-1/2 right-0 h-0.5 transition-all ${
                step.done || step.skipped ? "bg-brand-action" : "bg-gray-200"
              }`}
            />
          )}
          <div
            className={`relative z-10 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold border-2 transition-all ${
              step.done
                ? "bg-brand-action border-brand-action text-white"
                : step.skipped
                  ? "bg-white border-brand-action text-brand-action"
                  : currentStep === i
                    ? "border-brand-action text-brand-action bg-white"
                    : "border-gray-200 text-gray-400 bg-white"
            }`}
          >
            {step.done ? (
              <Check size={10} strokeWidth={3} className="sm:hidden" />
            ) : null}
            {step.done ? (
              <Check size={13} strokeWidth={3} className="hidden sm:block" />
            ) : null}
            {step.skipped && !step.done ? (
              <Check size={10} strokeWidth={3} className="sm:hidden" />
            ) : null}
            {step.skipped && !step.done ? (
              <Check size={13} strokeWidth={3} className="hidden sm:block" />
            ) : null}
            {!step.done && !step.skipped && i + 1}
          </div>
          <span
            className={`mt-1 text-[9px] sm:text-xs whitespace-nowrap ${
              step.done || step.skipped || currentStep === i
                ? "text-gray-700 font-medium"
                : "text-gray-400"
            }`}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function SectionTeaser({ number, title }: { number: string; title: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 sm:px-6 sm:py-4 select-none">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
          {number}
        </div>
        <h2 className="font-semibold text-gray-300 text-base">{title}</h2>
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

  useEffect(() => {
    setValue(String(quantity));
  }, [quantity]);

  const debouncedUpdate = useRef(
    debounce((itemId: string, qty: number) => onUpdate(itemId, qty), 600),
  ).current;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setValue(raw);
    const num = parseInt(raw);
    if (!isNaN(num) && num >= 1) {
      if (num > 99) {
        toast.warning(
          "За количества над 99 бр. моля обадете се на 0888787852 за наличност.",
        );
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

  if (isUpdating)
    return <Loader2 size={13} className="animate-spin text-brand-action" />;

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
  const {
    cart,
    loading: cartLoading,
    removeFromCart,
    updateQuantity,
  } = useCart();
  const [optimisticItems, updateOptimisticItems] = useOptimistic(
    cart?.items ?? [],
    (state, { id, quantity }: { id: string; quantity: number }) =>
      state.map((item) => (item.id === id ? { ...item, quantity } : item)),
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

  const subtotal = cart?.prices.subtotal_excluding_tax;
  // Magento's grand_total doesn't include shipping until the method is set on the cart
  // (we only store it locally until order placement), so compute displayed total client-side.
  const total = subtotal
    ? {
        value: subtotal.value + (shippingCost ?? 0),
        currency: subtotal.currency,
      }
    : undefined;

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
          {optimisticItems
            .filter((item) => item.product)
            .map((item) => {
              const price = item.product.price_range.minimum_price.final_price;
              return (
                <li key={item.id} className="flex gap-3 items-start">
                  <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                    <MagentoImage
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
                          onClick={() =>
                            item.quantity > 1 &&
                            updatingId !== item.id &&
                            handleUpdateQuantity(item.id, item.quantity - 1)
                          }
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
                          onClick={() =>
                            updatingId !== item.id &&
                            handleUpdateQuantity(item.id, item.quantity + 1)
                          }
                          className={`w-7 h-7 flex items-center justify-center bg-brand-action-light text-white hover:bg-brand-action transition-colors cursor-pointer ${updatingId === item.id ? "opacity-30 pointer-events-none" : ""}`}
                        >
                          <Plus size={12} />
                        </div>
                      </div>
                      <p className="text-base font-semibold text-gray-900 shrink-0">
                        {(price.value * item.quantity).toFixed(2)}&nbsp;
                        {price.currency}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={removingId === item.id}
                    className="text-gray-300 hover:text-red-400 cursor-pointer shrink-0 disabled:cursor-not-allowed mt-0.5"
                    aria-label="Премахни"
                  >
                    {removingId === item.id ? (
                      <Loader2
                        size={15}
                        className="animate-spin text-brand-action"
                      />
                    ) : (
                      <Trash2 size={15} />
                    )}
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
                : `${shippingCost.toFixed(2)} ${subtotal?.currency ?? "EUR"}`}
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
        <span className="text-sm font-semibold text-gray-900 shrink-0">
          {price}
        </span>
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
      email: "",
      firstname: "",
      lastname: "",
      telephone: "",
      street: "",
      city: "",
      postcode: "",
      region: "",
    },
  });

  // Restore sessionStorage after hydration to avoid server/client HTML mismatch.
  // Also compute validity immediately from stored values — the watch subscription
  // isn't active yet when reset() fires, so validity would otherwise stay false.
  useEffect(() => {
    const stored = getStoredForm();
    if (Object.keys(stored).length > 0) {
      reset(
        {
          email: "",
          firstname: "",
          lastname: "",
          telephone: "",
          street: "",
          city: "",
          postcode: "",
          region: "",
          ...stored,
        },
        { keepErrors: false },
      );
      const cv =
        !!stored.email?.trim() &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stored.email.trim()) &&
        !!stored.telephone?.trim() &&
        stored.telephone.trim().length >= 6 &&
        !!stored.firstname?.trim() &&
        !!stored.lastname?.trim();
      const sv =
        cv &&
        !!stored.street?.trim() &&
        !!stored.city?.trim() &&
        !!stored.postcode?.trim() &&
        !!stored.region?.trim();
      setContactValid(cv);
      setShippingValid(sv);
    }
    setFormRestoring(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Validity as state — only changes when thresholds are crossed, not on every keystroke.
  // Using the subscription form of watch (callback-based) avoids re-rendering CheckoutPage
  // on every keystroke; startTransition defers validity re-renders so the browser paints
  // the input event response first, which is what INP measures.
  const [contactValid, setContactValid] = useState(false);
  const [shippingValid, setShippingValid] = useState(false);

  useEffect(() => {
    const sub = watchForm((values) => {
      try {
        sessionStorage.setItem(FORM_KEY, JSON.stringify(values));
      } catch {}
      const cv =
        !!values.email?.trim() &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) &&
        !!values.telephone?.trim() &&
        values.telephone.trim().length >= 6 &&
        !!values.firstname?.trim() &&
        !!values.lastname?.trim();
      const sv =
        cv &&
        !!values.street?.trim() &&
        !!values.city?.trim() &&
        !!values.postcode?.trim() &&
        !!values.region?.trim();
      startTransition(() => {
        setContactValid(cv);
        setShippingValid(sv);
      });
    });
    return () => sub.unsubscribe();
  }, [watchForm]);

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("");
  const [selectedOffice, setSelectedOffice] = useState<{
    id: number;
    name: string;
    address: { city: { name: string; postCode: string }; fullAddress: string };
  } | null>(null);
  const [methodsLoading, setMethodsLoading] = useState(false);

  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingAddress, setBillingAddress] = useState<ShippingAddress>({
    firstname: "",
    lastname: "",
    street: "",
    city: "",
    region: "",
    postcode: "",
    country_code: "BG",
    telephone: "",
  });

  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [cfToken, setCfToken] = useState<string | null>(null);

  // ── Revolut card field state ─────────────────────────────────────────────────
  const [revolutPublicId, setRevolutPublicId] = useState<string | null>(null);
  const [revolutOrderId, setRevolutOrderId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cardField, setCardField] = useState<any>(null);
  const [cardFieldReady, setCardFieldReady] = useState(false);
  const [cardFieldContainer, setCardFieldContainer] =
    useState<HTMLDivElement | null>(null);
  const [cardholderName, setCardholderName] = useState("");
  const [prContainer, setPrContainer] = useState<HTMLDivElement | null>(null);
  const cardSubmittingRef = useRef(false);

  // Form restoring from sessionStorage (avoids flash of empty inputs on mount/Revolut redirect)
  const [formRestoring, setFormRestoring] = useState(true);

  // ── Init card field when revolut_pay is selected and container is in DOM ─────
  useEffect(() => {
    const isRevolutSelected =
      selectedPayment === "revolut_pay" ||
      selectedPayment === "revolut_pay_later";
    if (!isRevolutSelected || !cardFieldContainer) return;

    let instance: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
    let destroyed = false;

    (async () => {
      try {
        // Create Revolut order to get the token
        const res = await fetch("/api/checkout/revolut-order", {
          method: "POST",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok || destroyed) return;

        const token: string = data.publicId;
        const ordId: string = data.orderId;
        setRevolutOrderId(ordId);

        const RC = await RevolutCheckout(
          token,
          process.env.NEXT_PUBLIC_REVOLUT_ENV === "sandbox"
            ? "sandbox"
            : "prod",
        );
        if (destroyed) return;

        instance = RC.createCardField({
          target: cardFieldContainer,
          locale: "bg",
          styles: {
            default: {
              color: "#111827",
              fontSize: "16px",
              fontFamily: "inherit",
            },
            focused: {
              color: "#111827",
            },
            invalid: {
              color: "#ef4444",
            },
          },
          onSuccess() {
            cardSubmittingRef.current = false;
            setRevolutPublicId(token);
          },
          onError(error: { message?: string }) {
            cardSubmittingRef.current = false;
            setPlaceError(error?.message ?? "Грешка при плащането с карта");
            setPlacing(false);
          },
          onValidation(errors: { message: string }[]) {
            if (cardSubmittingRef.current && errors.length > 0) {
              cardSubmittingRef.current = false;
              setPlacing(false);
              setPlaceError("Моля, попълнете данните на картата.");
            }
          },
        });
        setCardField(instance);
        setCardFieldReady(true);
         
      } catch {
        if (!destroyed)
          setPlaceError("Грешка при зареждане на формата за карта");
      }
    })();

    return () => {
      destroyed = true;
      try {
        instance?.destroy();
      } catch {}
      setCardField(null);
      setCardFieldReady(false);
      setRevolutPublicId(null);
      setRevolutOrderId(null);
    };
  }, [selectedPayment, cardFieldContainer]);

  // ── Payment request (Apple Pay / Google Pay) ────────────────────────────────
  useEffect(() => {
    if (!prContainer) return;
    let destroyed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let instance: any = null;
    (async () => {
      try {
        const res = await fetch("/api/checkout/revolut-order", {
          method: "POST",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok || destroyed) return;
        const token: string = data.publicId;
        const orderId: string = data.orderId;
        const env =
          process.env.NEXT_PUBLIC_REVOLUT_ENV === "sandbox"
            ? "sandbox"
            : "prod";
        const RC = await RevolutCheckout(token, env);
        if (destroyed) return;
        instance = RC.paymentRequest({
          target: prContainer,
          requestShipping: false,
          locale: "bg",
          onSuccess() {
            setRevolutOrderId(orderId);
            setSelectedPayment("revolut_pay");
            setRevolutPublicId(token);
          },
          onError(error: { message?: string }) {
            setPlaceError(error?.message ?? "Грешка при Apple/Google Pay");
          },
          onCancel() {},
        });
      } catch {}
    })();
    return () => {
      destroyed = true;
      try {
        instance?.destroy();
      } catch {}
    };
  }, [prContainer]);

  // ── Auto-place order the moment card payment succeeds ────────────────────────
  useEffect(() => {
    if (!revolutPublicId) return;
    handlePlaceOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revolutPublicId]);

  // ── Load everything on mount — no form dependency ────────────────────────────
  const DEFAULT_BG_ADDRESS: ShippingAddress = {
    firstname: "Customer",
    lastname: "Customer",
    street: "ул. Витоша 1",
    city: "София",
    region: "София",
    postcode: "1000",
    country_code: "BG",
    telephone: "0888000000",
  };

  function applyMethodsData(data: {
    shippingMethods?: ShippingMethod[];
    paymentMethods?: PaymentMethod[];
  }) {
    const shipping: ShippingMethod[] = data.shippingMethods ?? [];
    const payment: PaymentMethod[] = data.paymentMethods ?? [];
    setShippingMethods(shipping);
    setPaymentMethods(payment);
    if (payment.length > 0) {
      let savedPayment: string | null = null;
      try {
        const saved = sessionStorage.getItem("revolut_checkout_state");
        if (saved) savedPayment = JSON.parse(saved).selectedPayment ?? null;
      } catch {}
      const preferred =
        savedPayment ??
        payment.find((m) => m.code === "revolut_pay")?.code ??
        payment[0].code;
      setSelectedPayment(preferred);
    }
  }

  useEffect(() => {
    prefetchOffices("econt");
    prefetchOffices("speedy");
  }, []);

  function fetchShippingMethods() {
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
  }

  // Fetch shipping methods only after the user completes contact info — the shipping section
  // is hidden (teaser) until contactValid anyway, so fetching earlier wastes a round-trip.
  // Re-fetch when cartTotal changes (e.g. quantity update) in case free-shipping threshold moves.
  const cartTotal = cart?.prices?.grand_total?.value;
  const didFetchRef = useRef(false);
  useEffect(() => {
    if (!contactValid || cartTotal === undefined) return;
    // On first run, try the prefetch cache before hitting the API
    if (!didFetchRef.current) {
      didFetchRef.current = true;
      try {
        const cached = sessionStorage.getItem("checkout_prefetch");
        if (cached) {
          sessionStorage.removeItem("checkout_prefetch");
          applyMethodsData(JSON.parse(cached));
          return;
        }
      } catch {}
    }
    fetchShippingMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactValid, cartTotal]);

  // ── Shipping cost for summary ───────────────────────────────────────────────
  const selectedShippingMethod = shippingMethods.find(
    (m) => `${m.carrier_code}|${m.method_code}` === selectedShipping,
  );
  const isAddressDelivery =
    !!selectedShippingMethod &&
    (
      selectedShippingMethod.carrier_title +
      " " +
      selectedShippingMethod.method_title
    )
      .toLowerCase()
      .includes("адрес");
  const methodLabel = (
    (selectedShippingMethod?.carrier_title ?? "") +
    " " +
    (selectedShippingMethod?.method_title ?? "")
  ).toLowerCase();
  const isOfficeDelivery =
    selectedShipping !== "" &&
    !isAddressDelivery &&
    (methodLabel.includes("speedy") || methodLabel.includes("econt") || methodLabel.includes("еконт"));
  const selectedCourier = methodLabel.includes("speedy") ? "speedy" : "econt";
  const effectiveShippingValid = isOfficeDelivery
    ? contactValid
    : shippingValid;

  // ── Place order ─────────────────────────────────────────────────────────────
  async function handlePlaceOrder() {
    setPlaceError(null);
    setPlacing(true);
    try {
      const { email: rawEmail, ...currentAddressFields } = getShipping();
      const currentEmail = rawEmail?.trim();
      const currentShippingAddress: ShippingAddress = {
        ...currentAddressFields,
        country_code: "BG",
      };
      const [carrierCode, methodCode] = selectedShipping.split("|");
      const effectiveShippingAddress: ShippingAddress =
        !isAddressDelivery && selectedOffice
          ? {
              firstname: currentShippingAddress.firstname,
              lastname: currentShippingAddress.lastname,
              telephone: currentShippingAddress.telephone,
              street: [
                selectedShippingMethod?.carrier_title ?? "",
                selectedOffice.address.fullAddress
                  .replace(selectedOffice.address.city.name, "")
                  .trim(),
              ],
              city: selectedOffice.address.city.name,
              postcode: selectedOffice.address.city.postCode || "0000",
              region: selectedOffice.address.city.name,
              country_code: "BG",
            }
          : currentShippingAddress;
      const res = await fetch("/api/checkout/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: currentEmail,
          shippingAddress: effectiveShippingAddress,
          shippingMethod: {
            carrier_code: carrierCode,
            method_code: methodCode,
          },
          billingAddress: billingSameAsShipping
            ? effectiveShippingAddress
            : billingAddress,
          paymentMethod:
            revolutPublicId && isRevolutPay
              ? {
                  method: selectedPayment,
                  additional_data: {
                    public_id: revolutPublicId,
                    order_id: revolutOrderId ?? "",
                  },
                }
              : { method: selectedPayment },
          cfToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Грешка при поръчката");
      try {
        sessionStorage.removeItem("revolut_checkout_state");
        sessionStorage.removeItem(FORM_KEY);
      } catch {}
      router.push(
        `/onestepcheckout/success?order=${encodeURIComponent(data.orderNumber)}`,
      );
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
  const isRevolutPay =
    selectedPayment === "revolut_pay" ||
    selectedPayment === "revolut_pay_later";
  const billingValid =
    billingSameAsShipping ||
    (billingAddress.firstname.trim() !== "" &&
      billingAddress.lastname.trim() !== "" &&
      billingAddress.telephone.trim().length >= 6 &&
      (Array.isArray(billingAddress.street)
        ? billingAddress.street[0]
        : billingAddress.street
      ).trim() !== "" &&
      billingAddress.city.trim() !== "" &&
      billingAddress.postcode.trim() !== "" &&
      billingAddress.region.trim() !== "");
  const canPlaceOrder =
    effectiveShippingValid &&
    billingValid &&
    methodsReady &&
    selectedShipping !== "" &&
    selectedPayment !== "" &&
    (!isRevolutPay || cardFieldReady || revolutPublicId !== null) &&
    (isAddressDelivery || !!selectedOffice) &&
    !!cfToken &&
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
      {/* ── Main layout ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-10 xl:gap-16">
          {/* ══ LEFT: Form ══════════════════════════════════════════════════ */}
          <div className="flex-1 min-w-0 max-w-lg space-y-6">
            <div className="lg:sticky lg:top-40 z-20 bg-gray-50 py-3 -mx-4 sm:-mx-6 px-4 sm:px-6">
              <CheckoutProgress
                contactValid={contactValid}
                shippingSelected={contactValid && selectedShipping !== ""}
                shippingValid={isOfficeDelivery ? false : shippingValid}
                addressSkipped={isOfficeDelivery}
                billingValid={effectiveShippingValid && billingValid}
                paymentDone={
                  effectiveShippingValid &&
                  billingValid &&
                  selectedPayment !== "" &&
                  (!isRevolutPay || !!revolutPublicId)
                }
              />
            </div>

            {/* 01 · Contact */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <SectionHeader number="1" title="Данни за контакт" />
              {formRestoring ? (
                <div className="space-y-4 animate-pulse">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="h-11 bg-gray-100 rounded-lg" />
                    <div className="h-11 bg-gray-100 rounded-lg" />
                  </div>
                  <div className="h-11 bg-gray-100 rounded-lg" />
                  <div className="h-11 bg-gray-100 rounded-lg" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      label="Име"
                      required
                      error={shippingErrors.firstname?.message}
                    >
                      <input
                        className={inputBase}
                        placeholder="Иван"
                        autoComplete="given-name"
                        {...register("firstname")}
                      />
                    </Field>
                    <Field
                      label="Фамилия"
                      required
                      error={shippingErrors.lastname?.message}
                    >
                      <input
                        className={inputBase}
                        placeholder="Иванов"
                        autoComplete="family-name"
                        {...register("lastname")}
                      />
                    </Field>
                  </div>
                  <Field
                    label="Имейл адрес"
                    required
                    error={shippingErrors.email?.message}
                  >
                    <input
                      type="text"
                      inputMode="email"
                      className={inputBase}
                      placeholder="you@example.com"
                      autoComplete="email"
                      {...register("email")}
                    />
                  </Field>
                  <Field
                    label="Телефон"
                    required
                    error={shippingErrors.telephone?.message}
                  >
                    <input
                      type="tel"
                      className={inputBase}
                      placeholder="+359 88 888 8888"
                      autoComplete="tel"
                      {...register("telephone")}
                    />
                  </Field>
                </div>
              )}
            </div>

            {/* 02-05 */}
            <div className="space-y-6">
              {/* 02 · Shipping method */}
              {!contactValid ? (
                <SectionTeaser number="2" title="Метод на доставка" />
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                  <SectionHeader number="2" title="Метод на доставка" loading={methodsLoading} />
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
                            onChange={() => { setSelectedShipping(value); setSelectedOffice(null); }}
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
                  {isOfficeDelivery && (
                    <div className="relative z-10 mt-4">
                      <CourierOfficeSelector
                        value={selectedOffice}
                        onChange={setSelectedOffice}
                        courier={selectedCourier}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 03 · Shipping address */}
              {!isAddressDelivery ? (
                <SectionTeaser number="3" title="Адрес за доставка" />
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                  <SectionHeader number="3" title="Адрес за доставка" />
                  {formRestoring ? (
                    <div className="space-y-4 animate-pulse">
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
                      <Field
                        label="Адрес"
                        required
                        error={shippingErrors.street?.message}
                      >
                        <input
                          className={inputBase}
                          placeholder="ул. Витоша 1"
                          autoComplete="street-address"
                          {...register("street")}
                        />
                      </Field>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field
                          label="Град"
                          required
                          error={shippingErrors.city?.message}
                        >
                          <input
                            className={inputBase}
                            placeholder="София"
                            autoComplete="address-level2"
                            {...register("city")}
                          />
                        </Field>
                        <Field
                          label="Пощенски код"
                          required
                          error={shippingErrors.postcode?.message}
                        >
                          <input
                            className={inputBase}
                            placeholder="1000"
                            autoComplete="postal-code"
                            {...register("postcode")}
                          />
                        </Field>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field
                          label="Област"
                          required
                          error={shippingErrors.region?.message}
                        >
                          <input
                            className={inputBase}
                            placeholder="Софийска"
                            {...register("region")}
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
                </div>
              )}

              {/* 04 · Billing address */}
              {!effectiveShippingValid ? (
                <SectionTeaser number="4" title="Адрес за фактуриране" />
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                  <SectionHeader number="4" title="Адрес за фактуриране" />
                  <label className="flex items-center gap-3 cursor-pointer group mb-4">
                    <div
                      onClick={() =>
                        setBillingSameAsShipping((p: boolean) => !p)
                      }
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        billingSameAsShipping
                          ? "bg-brand-action border-brand-action"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {billingSameAsShipping && (
                        <svg
                          viewBox="0 0 10 8"
                          className="w-3 h-3 text-white fill-current"
                        >
                          <path
                            d="M1 4l3 3 5-6"
                            stroke="white"
                            strokeWidth="1.5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
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
                            onChange={(e) =>
                              updateBilling("firstname", e.target.value)
                            }
                            placeholder="Иван"
                          />
                        </Field>
                        <Field label="Фамилия" required>
                          <input
                            className={inputBase}
                            value={billingAddress.lastname}
                            onChange={(e) =>
                              updateBilling("lastname", e.target.value)
                            }
                            placeholder="Иванов"
                          />
                        </Field>
                      </div>
                      <Field label="Телефон" required>
                        <input
                          type="tel"
                          className={inputBase}
                          value={billingAddress.telephone}
                          onChange={(e) =>
                            updateBilling("telephone", e.target.value)
                          }
                          placeholder="+359 88 888 8888"
                        />
                      </Field>
                      <Field label="Адрес" required>
                        <input
                          className={inputBase}
                          value={billingAddress.street}
                          onChange={(e) =>
                            updateBilling("street", e.target.value)
                          }
                          placeholder="ул. Витоша 1"
                        />
                      </Field>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Град" required>
                          <input
                            className={inputBase}
                            value={billingAddress.city}
                            onChange={(e) =>
                              updateBilling("city", e.target.value)
                            }
                            placeholder="София"
                          />
                        </Field>
                        <Field label="Пощенски код" required>
                          <input
                            className={inputBase}
                            value={billingAddress.postcode}
                            onChange={(e) =>
                              updateBilling("postcode", e.target.value)
                            }
                            placeholder="1000"
                          />
                        </Field>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Област" required>
                          <input
                            className={inputBase}
                            value={billingAddress.region}
                            onChange={(e) =>
                              updateBilling("region", e.target.value)
                            }
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
                </div>
              )}

              {/* 05 · Payment method */}
              {!effectiveShippingValid ? (
                <SectionTeaser number="5" title="Начин на плащане" />
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                  <SectionHeader number="5" title="Начин на плащане" />
                  {methodsLoading ? (
                    <MethodsSkeleton />
                  ) : (
                    <div className="space-y-2">
                      {/* Apple Pay / Google Pay — self-hides if not supported on this device/browser */}
                      <div ref={setPrContainer} className="w-full" />

                      {/* Revolut card field — standalone (не зависи от Magento revolut_pay метод) */}
                      <div>
                        <MethodRadio
                          name="paymentMethod"
                          value="revolut_pay"
                          checked={selectedPayment === "revolut_pay"}
                          onChange={() => {
                            setSelectedPayment("revolut_pay");
                            setRevolutPublicId(null);
                          }}
                          label="Плащане с карта"
                        />
                        <div
                          className={`mt-3 ${selectedPayment === "revolut_pay" ? "block" : "hidden"}`}
                        >
                          {/* Loading state */}
                          {!cardFieldReady && !revolutPublicId && (
                            <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
                              <Loader2 size={14} className="animate-spin" />
                              Зареждане на формата за карта…
                            </div>
                          )}
                          {/* Payment confirmed state */}
                          {revolutPublicId && (
                            <div className="flex items-center gap-2 py-3 pl-4 text-sm text-brand-nav font-medium">
                              <svg
                                viewBox="0 0 16 16"
                                className="w-4 h-4 fill-brand-action shrink-0"
                              >
                                <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm3.54 5.46-4.25 4.25-1.83-1.83a.75.75 0 1 0-1.06 1.06l2.36 2.36a.75.75 0 0 0 1.06 0l4.78-4.78a.75.75 0 1 0-1.06-1.06z" />
                              </svg>
                              Плащането е потвърдено — готово за поръчка
                            </div>
                          )}
                          {/* Card form — always mounted so Revolut has a stable DOM node; hidden until ready */}
                          {/* Use invisible+h-0 instead of display:none so iOS Safari initialises the iframe JS context */}
                          <div
                            className={
                              cardFieldReady && !revolutPublicId
                                ? "rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3"
                                : "invisible h-0 overflow-hidden"
                            }
                          >
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Име на картодържателя
                              </label>
                              <input
                                type="text"
                                value={cardholderName}
                                onChange={(e) =>
                                  setCardholderName(e.target.value)
                                }
                                placeholder="Иван Иванов"
                                autoComplete="cc-name"
                                className={inputBase}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Данни на картата
                              </label>
                              <div className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-3 pr-4 hover:border-gray-300 transition-colors">
                                <div
                                  ref={setCardFieldContainer}
                                  className="w-full"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-center gap-2 pt-1 text-xs text-gray-400">
                              <ShieldCheck size={18} className="shrink-0" />
                              <span>
                                Защитено от{" "}
                                <span className="font-semibold text-gray-500">
                                  Revolut
                                </span>
                              </span>
                              <div className="flex items-center gap-1 ml-1">
                                {/* Visa */}
                                <svg
                                  viewBox="0 0 38 24"
                                  className="h-5 w-auto opacity-70"
                                  role="img"
                                  aria-label="Visa"
                                >
                                  <rect
                                    width="38"
                                    height="24"
                                    rx="3"
                                    fill="#fff"
                                    stroke="#e5e7eb"
                                    strokeWidth="1"
                                  />
                                  <text
                                    x="19"
                                    y="17"
                                    textAnchor="middle"
                                    fontFamily="Arial,sans-serif"
                                    fontWeight="700"
                                    fontSize="13"
                                    fill="#1A1F71"
                                    letterSpacing="1"
                                  >
                                    VISA
                                  </text>
                                </svg>
                                {/* Mastercard */}
                                <svg
                                  viewBox="0 0 38 24"
                                  className="h-5 w-auto opacity-70"
                                  role="img"
                                  aria-label="Mastercard"
                                >
                                  <rect
                                    width="38"
                                    height="24"
                                    rx="3"
                                    fill="#fff"
                                    stroke="#e5e7eb"
                                    strokeWidth="1"
                                  />
                                  <circle
                                    cx="15"
                                    cy="12"
                                    r="7"
                                    fill="#EB001B"
                                  />
                                  <circle
                                    cx="23"
                                    cy="12"
                                    r="7"
                                    fill="#F79E1B"
                                  />
                                  <path
                                    d="M19 6.8a7 7 0 0 1 0 10.4A7 7 0 0 1 19 6.8z"
                                    fill="#FF5F00"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Other Magento payment methods (excluding revolut_pay — handled above) */}
                      {/* When revolut_pay is re-enabled on Magento, filter it out here:
                  {paymentMethods.filter(m => m.code !== "revolut_pay" && m.code !== "revolut_pay_later").map((m) => (
                    <MethodRadio
                      key={m.code}
                      name="paymentMethod"
                      value={m.code}
                      checked={selectedPayment === m.code}
                      onChange={() => { setSelectedPayment(m.code); setRevolutPublicId(null); }}
                      label={m.title}
                    />
                  ))} */}
                      {paymentMethods
                        .filter((m) => !m.code.startsWith("revolut"))
                        .map((m) => (
                          <MethodRadio
                            key={m.code}
                            name="paymentMethod"
                            value={m.code}
                            checked={selectedPayment === m.code}
                            onChange={() => {
                              setSelectedPayment(m.code);
                              setRevolutPublicId(null);
                            }}
                            label={m.title}
                          />
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Order summary — mobile only */}
              <div className="lg:hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                <h2 className="font-semibold text-gray-900 text-base mb-5">
                  Резюме на поръчката
                </h2>
                <OrderSummary
                  shippingCost={selectedShippingMethod?.amount.value}
                />
              </div>

              {/* Place order — mobile only */}
              <div className="lg:hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
                {placeError && (
                  <p className="text-sm text-red-500 mb-4">{placeError}</p>
                )}
                <div className="mb-4">
                  <TurnstileWidget
                    onSuccess={setCfToken}
                    onExpire={() => setCfToken(null)}
                    onError={() => setCfToken(null)}
                  />
                </div>
                <button
                  onClick={
                    isRevolutPay
                      ? () => {
                          cardSubmittingRef.current = true;
                          setPlacing(true);
                          try {
                            cardField?.submit({
                              email: getShipping().email?.trim(),
                              name: cardholderName.trim(),
                            });
                          } catch {
                            cardSubmittingRef.current = false;
                            setPlacing(false);
                          }
                        }
                      : handlePlaceOrder
                  }
                  disabled={!canPlaceOrder}
                  className="w-full flex items-center justify-center gap-2.5 bg-brand-action hover:bg-brand-action-light disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-4 rounded-xl transition-colors text-base shadow-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  {placing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Обработва се…
                    </>
                  ) : isRevolutPay ? (
                    "Плати с карта"
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
              <OrderSummary
                shippingCost={selectedShippingMethod?.amount.value}
              />
              <div className="border-t border-gray-100 mt-4 pt-4">
                {placeError && (
                  <p className="text-sm text-red-500 mb-4">{placeError}</p>
                )}
                <div className="mb-4">
                  <TurnstileWidget
                    onSuccess={setCfToken}
                    onExpire={() => setCfToken(null)}
                    onError={() => setCfToken(null)}
                  />
                </div>
                <button
                  onClick={
                    isRevolutPay
                      ? () => {
                          cardSubmittingRef.current = true;
                          setPlacing(true);
                          try {
                            cardField?.submit({
                              email: getShipping().email?.trim(),
                              name: cardholderName.trim(),
                            });
                          } catch {
                            cardSubmittingRef.current = false;
                            setPlacing(false);
                          }
                        }
                      : handlePlaceOrder
                  }
                  disabled={!canPlaceOrder}
                  className="w-full flex items-center justify-center gap-2.5 bg-brand-action hover:bg-brand-action-light disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-4 rounded-xl transition-colors text-base shadow-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  {placing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Обработва се…
                    </>
                  ) : isRevolutPay ? (
                    "Плати с карта"
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
