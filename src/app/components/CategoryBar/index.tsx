import Image from "next/image";
import Link from "next/link";

const CATEGORIES = [
  {
    label: "Грижа за дома",
    href: "/grizha-za-doma",
    icon: "/assets/OmekotitelIcons/grizha-za-doma-icon-v2.svg",
  },
  {
    label: "Грижа за дрехи",
    href: "/cjalostna-grizha-za-drehi",
    icon: "/assets/OmekotitelIcons/grizha-za-drehi-icon-v2-no-sparkles.svg",
  },
  {
    label: "Пране",
    href: "/prane-vsichko-neobhodimo",
    icon: "/assets/OmekotitelIcons/prane-vsichko-neobhodimo-icon.svg",
  },
  {
    label: "Мама & Дете",
    href: "/mama-dete-produkti",
    icon: "/assets/OmekotitelIcons/mama-dete-produkti-icon.svg",
  },
  {
    label: "Професионални",
    href: "/profesionalni-produkti",
    icon: "/assets/OmekotitelIcons/profesionalni-produkti-icon-final.svg",
  },
  {
    label: "Домашни любимци",
    href: "/grizha-za-doma/domashni-lyubimci",
    icon: "/assets/OmekotitelIcons/domashni-lyubimci-icon.svg",
  },
  {
    label: "Кухня",
    href: "/grizha-za-doma/kuhnja",
    icon: "/assets/OmekotitelIcons/kuhnja-icon.svg",
  },
  {
    label: "Грижа за тяло",
    href: "/pochistvaschi-i-polezni-artikuli/tjalo",
    icon: "/assets/OmekotitelIcons/body-products-icon.svg",
  },
  {
    label: "Грижа за коса",
    href: "/pochistvaschi-i-polezni-artikuli/kosa",
    icon: "/assets/OmekotitelIcons/hair-products-icon.svg",
  },
];

export default function CategoryBar() {
  return (
    <section className="pt-3 pb-2 md:pb-4 px-4 border-b border-gray-100">
      <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-900 mb-4 md:mb-3">
        Пазарувай по категория
      </p>
      <div className="relative md:static">
        <div className="flex md:flex-wrap md:justify-center gap-3 md:gap-4 overflow-x-auto md:overflow-visible px-2 md:px-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="flex flex-col items-center gap-1.5 w-24 md:w-24 shrink-0 text-center group"
            >
              <div className="w-20 h-20 md:w-20 md:h-20 flex items-center justify-center">
                <Image
                  src={cat.icon}
                  alt={cat.label}
                  width={80}
                  height={80}
                  className="group-hover:scale-110 transition-transform duration-200"
                />
              </div>
              <span className="text-sm md:text-sm text-gray-600 group-hover:text-brand-nav leading-tight transition-colors">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
        {/* Scroll hint arrow — mobile only */}
        <div className="md:hidden pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1">
          <span
            className="text-gray-400 text-lg leading-none"
            style={{ animation: "nudge 0.8s ease-in-out 1.2s 3" }}
          >
            ›
          </span>
        </div>
      </div>
    </section>
  );
}
