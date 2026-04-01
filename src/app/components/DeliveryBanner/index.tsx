import Link from "next/link";
import { Truck } from "lucide-react";

export const DeliveryBanner = ({ className }: { className?: string } = {}) => (
  <Link href="/dostavka" className={`w-full bg-brand-nav text-white text-sm sm:text-base py-2 px-3 sm:px-4 flex items-center justify-center gap-2 overflow-hidden hover:brightness-110 transition-[filter] ${className ?? ""}`}>
    <Truck size={20} className="shrink-0 sm:w-6 sm:h-6" />
    <span className="truncate">Безплатна доставка при поръчки над 40,90 €</span>
  </Link>
);