import { Truck, BadgeCheck, ShieldCheck, MessageCircle } from "lucide-react";

const ITEMS = [
  {
    icon: Truck,
    title: "Безплатна доставка",
    subtitle: "над 50€",
  },
  {
    icon: BadgeCheck,
    title: "Качество на стоките",
    subtitle: "Проверени продукти",
  },
  {
    icon: ShieldCheck,
    title: "100% сигурност",
    subtitle: "При пазаруване",
  },
  {
    icon: MessageCircle,
    title: "Консултация от специалист",
    subtitle: "24/7 отговаряме на въпроси",
  },
];

export default function TrustBar() {
  return (
    <div className="bg-brand-nav border-b-2 border-brand-action">
      <div className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ITEMS.map(({ icon: Icon, title, subtitle }) => (
          <div key={title} className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <div className="shrink-0 w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
              <Icon size={28} className="text-white" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide leading-tight">{title}</p>
              <p className="text-xs text-white/70 leading-tight">{subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
