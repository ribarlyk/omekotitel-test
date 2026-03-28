"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Plus, Minus } from "lucide-react";
import { useOptimistic, useState, useTransition, useEffect, useRef } from "react";
import debounce from "lodash/debounce";
import { toast } from "sonner";
import { useCart } from "@/src/app/contexts/CartContext";
import { magentoImageUrl } from "@/src/app/utils/image";
import { CartPanelLayout } from "@/src/app/components/CartPanelLayout";

interface QuantityInputProps {
  id: string;
  quantity: number;
  isUpdating: boolean;
  onUpdate: (id: string, qty: number) => void;
}

const QuantityInput = ({ id, quantity, isUpdating, onUpdate }: QuantityInputProps) => {
  const [value, setValue] = useState(String(quantity));

  useEffect(() => {
    setValue(String(quantity));
  }, [quantity]);

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
};

export const CartPanel = ({ onClose }: { onClose: () => void }) => {
  const router = useRouter();
  const { cart, itemCount, loading, removeFromCart, updateQuantity } = useCart();
  const [optimisticItems, updateOptimisticItems] = useOptimistic(
    cart?.items ?? [],
    (state, { id, quantity }: { id: string; quantity: number }) =>
      state.map((item) => (item.id === id ? { ...item, quantity } : item))
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [navigating, startNavigate] = useTransition();

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

  if (loading) return <p className="p-6 text-gray-500 text-sm">Зареждане...</p>;

  if (!cart || itemCount === 0)
    return <p className="p-6 text-gray-500 text-sm">Количката ви е празна.</p>;

  const total = cart.prices.grand_total;

  return (
    <CartPanelLayout
      footer={
        <>
          <div className="flex justify-between text-base font-bold text-brand-nav mb-4">
            <span>Общо</span>
            <span>{total.value.toFixed(2)} {total.currency}</span>
          </div>
          <button
            onClick={() =>
              startNavigate(async () => {
                try {
                  const res = await fetch("/api/checkout/address", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                      shippingAddress: {
                        firstname: "Customer", lastname: "Customer",
                        street: "ул. Витоша 1", city: "София",
                        region: "София", postcode: "1000",
                        country_code: "BG", telephone: "0888000000",
                      },
                    }),
                  });
                  const data = await res.json();
                  sessionStorage.setItem("checkout_prefetch", JSON.stringify(data));
                } catch {}
                router.push("/onestepcheckout");
                onClose();
              })
            }
            disabled={navigating}
            className="flex items-center justify-center gap-2 w-full bg-brand-action disabled:opacity-70 text-white text-center py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:cursor-not-allowed"
          >
            {navigating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Зареждане…
              </>
            ) : (
              "Към плащане"
            )}
          </button>
        </>
      }
    >
      <ul className="flex flex-col gap-4">
        {optimisticItems.filter((item) => item.product).map((item) => {
          const price = item.product.price_range.minimum_price.final_price;
          return (
            <li key={item.id} className="flex gap-3 rounded-xl hover:bg-gray-50 transition-colors -mx-2 px-2 py-1">
              <Link href={`/${item.product.url_key}`} className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-gray-100">
                <Image
                  src={magentoImageUrl(item.product.thumbnail.url)}
                  alt={item.product.thumbnail.label || item.product.name}
                  fill
                  className="object-contain"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/${item.product.url_key}`} className="text-sm font-medium text-brand-nav line-clamp-2 hover:text-brand-action transition-colors">
                  {item.product.name}
                </Link>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center rounded-full overflow-hidden select-none border border-brand-action-light">
                    <div
                      onClick={() => item.quantity > 1 && updatingId !== item.id && handleUpdateQuantity(item.id, item.quantity - 1)}
                      className={`w-8 h-8 flex items-center justify-center bg-brand-action-light text-white hover:bg-brand-action transition-colors cursor-pointer ${item.quantity <= 1 || updatingId === item.id ? "opacity-30 pointer-events-none" : ""}`}
                    >
                      <Minus size={14} />
                    </div>
                    <span className="w-7 h-8 flex items-center justify-center">
                      <QuantityInput
                        id={item.id}
                        quantity={item.quantity}
                        isUpdating={updatingId === item.id}
                        onUpdate={handleUpdateQuantity}
                      />
                    </span>
                    <div
                      onClick={() => updatingId !== item.id && handleUpdateQuantity(item.id, item.quantity + 1)}
                      className={`w-8 h-8 flex items-center justify-center bg-brand-action-light text-white hover:bg-brand-action transition-colors cursor-pointer ${updatingId === item.id ? "opacity-30 pointer-events-none" : ""}`}
                    >
                      <Plus size={14} />
                    </div>
                  </div>
                  <span className="text-sm text-gray-700">{price.value.toFixed(2)} {price.currency}</span>
                </div>
              </div>
              <button
                onClick={() => handleRemove(item.id)}
                disabled={removingId === item.id}
                className="text-gray-300 hover:text-red-400 cursor-pointer shrink-0 disabled:cursor-not-allowed"
                aria-label="Премахни"
              >
                {removingId === item.id
                  ? <Loader2 size={16} className="animate-spin text-brand-action" />
                  : <Trash2 size={16} />
                }
              </button>
            </li>
          );
        })}
      </ul>
    </CartPanelLayout>
  );
};
