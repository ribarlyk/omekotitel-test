import Image from "next/image";
import Link from "next/link";

const CATEGORIES = [
  {
    label: "Почистващи артикули",
    href: "/pochistvaschi-i-polezni-artikuli",
    icon: "/assets/omekotitel-icon-cleaning-essentials.svg",
  },
  {
    label: "Грижа за дома",
    href: "/grizha-za-doma",
    icon: "/assets/omekotitel-icon-home.svg",
  },
  {
    label: "Грижа за дрехи",
    href: "/cjalostna-grizha-za-drehi",
    icon: "/assets/omekotitel-icon-home-essentials.svg",
  },
  {
    label: "Пране",
    href: "/prane-vsichko-neobhodimo",
    icon: "/assets/omekotitel-icon-holiday-sparkles.svg",
  },
  {
    label: "Мама & Дете",
    href: "/mama-dete-produkti",
    icon: "/assets/omekotitel-icon-baby-and-kids.svg",
  },
  {
    label: "Професионални",
    href: "/profesionalni-produkti",
    icon: "/assets/omekotitel-icon-health-and-wellness.svg",
  },
  {
    label: "Домашни любимци",
    href: "/grizha-za-doma/domashni-lyubimci",
    icon: "/assets/omekotitel-icon-pet-supplies.svg",
  },
  {
    label: "Кухня",
    href: "/grizha-za-doma/kuhnja",
    icon: "/assets/omekotitel-icon-kitchen.svg",
  },
  {
    label: "Против вредители",
    href: "/grizha-za-doma/protiv-komari-molci-grizachi-i-dr",
    icon: "/assets/omekotitel-icon-gardening.svg",
  },
  {
    label: "Грижа за тяло",
    href: "/pochistvaschi-i-polezni-artikuli/tjalo",
    icon: "/assets/omekotitel-icon-personal-care.svg",
  },
  {
    label: "Грижа за коса",
    href: "/pochistvaschi-i-polezni-artikuli/kosa",
    icon: "/assets/omekotitel-icon-clean-beauty.svg",
  },
];

export default function CategoryBar() {
  return (
    <section className="pt-3 pb-4 md:pb-8 px-4 border-b border-gray-100">
      <p className="text-center text-xs font-bold uppercase tracking-widest text-gray-900 mb-2 md:mb-3">
        Пазарувай по категория
      </p>
      <div className="relative md:static">
        <div className="flex md:flex-wrap md:justify-center gap-3 md:gap-4 overflow-x-auto md:overflow-visible px-2 md:px-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="flex flex-col items-center gap-1.5 w-16 md:w-20 shrink-0 text-center group"
            >
              <div className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center">
                <Image
                  src={cat.icon}
                  alt={cat.label}
                  width={56}
                  height={56}
                  className="group-hover:scale-110 transition-transform duration-200"
                />
              </div>
              <span className="text-xs text-gray-600 group-hover:text-brand-nav leading-tight transition-colors">
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
