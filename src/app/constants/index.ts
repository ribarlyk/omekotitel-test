export const FOOTER_COLUMNS = [
  {
    heading: "Информация",
    links: [
      { label: "За нас", href: "/za-nas" },
      { label: "Доставка", href: "/dostavka" },
      { label: "Лични данни и поверителност", href: "/privacy-policy-cookie-restriction-mode" },
      { label: "Общи условия", href: "/obschi-uslovija" },
      { label: "Свържи се с нас", href: "/contact" },
    ],
  },
  {
    heading: "Направени поръчки",
    links: [
      { label: "Моят акаунт", href: "/customer/account/login" },
      { label: "История на поръчките", href: "/sales/order/history" },
      { label: "Връщане на поръчка", href: "/vr-schane-na-por-chka" },
      { label: "Любими продукти", href: "/wishlist" },
      { label: "Сравни продукти", href: "/catalog/product_compare/" },
    ],
  },
  {
    heading: "Обслужване на клиенти",
    links: [
      { label: "Начини за плащане", href: "/nachini-za-plaschane" },
      { label: "Връщане на поръчка", href: "/vr-schane-na-por-chka" },
      { label: "Проследяване на поръчка", href: "/sales/order/history" },
      { label: "Често задавани въпроси", href: "/contact" },
    ],
  },
];

export const FOOTER_SOCIAL = [
  { label: "Facebook", href: "https://www.facebook.com/omekotitel", icon: "facebook" },
  { label: "Instagram", href: "https://www.instagram.com/omekotitel", icon: "instagram" },
];

export interface NavCatalogCategory {
  id: number;
  name: string;
  url_key: string | null;
  url_path: string | null;
  children?: NavCatalogCategory[];
}

export const DELIVERY_INFO = {
  intro:
    "Уважаеми клиенти, искаме да Ви информираме, че извършваме доставки в цялата страна посредством куриерските услуги на ЕКОНТ и Speedy. Всички поръчки се потвърждават от наш служител, който ще се свърже с Вас, за да потвърди поръчката Ви. Поръчките се обработват и изпращат в рамките на 2 работни дни. Непотвърдени поръчки не се изпращат.",
  subIntro:
    "Предлагаме доставка чрез куриер по Ваш избор – ЕКОНТ или Speedy, както и собствен транспорт за гр. София при предварителна уговорка по телефона.",
  methods: [
    "до адрес чрез Еконт или Speedy",
    "до офис на Еконт или Speedy",
    "до адрес за гр. София с директна доставка от omekotitel.bg (с предварителна уговорка по телефона)",
  ],
  pricing: [
    { label: "3.07 €", description: "до офис на Еконт или Speedy" },
    { label: "4.09 €", description: "до адрес на получателя (Еконт или Speedy)" },
    { label: "БЕЗПЛАТНА ДОСТАВКА", description: "до офис на Еконт или Speedy при поръчка над 50.00 €" },
    { label: "БЕЗПЛАТНА ДОСТАВКА", description: "до адрес в София с транспорт на omekotitel.bg при поръчка над 50.00 €" },
  ],
};

export const NAVGATIOM_ITEMS = [
  { name: "Всички продукти", href: "/catalog", main: true },
  { name: "Нови", href: "/" },
  { name: "Препоръчани", href: "/catalog" },
  { name: "Оферти", href: "/catalog" },
  { name: "Марки", href: "/catalog" },
  { name: "Контакти", href: "/catalog" },
];

export interface NavSubCategory {
  name: string;
  id: number;
}

export interface NavCategory {
  name: string;
  id: number;
  children?: NavSubCategory[];
}

export const NAV_CATALOG_ITEMS: NavCategory[] = [
  {
    name: "Цялостна Грижа за Дрехи",
    id: 9,
    children: [
      { name: "Парфюми и Аксесоари за Сушилня", id: 60 },
      { name: "Петна и Замърсявания", id: 25 },
      { name: "Ароматизатори за Дрехи", id: 62 },
      { name: "Четки и Аксесоари за Дрехи", id: 6 },
      { name: "Грижа за Кожени Изделия", id: 50 },
    ],
  },
  {
    name: "Грижа за Автомобила",
    id: 221,
    children: [
      { name: "Ароматизатори За Автомобили", id: 33 },
      { name: "Почистване и Детайлинг Автомобили", id: 222 },
    ],
  },
//   {
//     name: "Марки",
//     id: 83,
//     children: [
//       { name: "Hygienfresh", id: 103 },
//       { name: "Chanteclair", id: 97 },
//       { name: "Lenor", id: 84 },
//       { name: "Felce Azzurra", id: 102 },
//       { name: "Ariel", id: 203 },
//       { name: "Winni's", id: 165 },
//       { name: "Dash", id: 87 },
//       { name: "Tesori D'Oriente", id: 86 },
//       { name: "The Pink Stuff", id: 202 },
//       { name: "ACE", id: 113 },
//       { name: "Ambi Pur", id: 140 },
//       { name: "Coral", id: 204 },
//       { name: "Nesti Dante", id: 104 },
//       { name: "Coccolatevi", id: 205 },
//       { name: "Deo Due", id: 180 },
//       { name: "Astonish", id: 160 },
//       { name: "Dalli", id: 157 },
//       { name: "Vileda", id: 131 },
//       { name: "Arbre Magique", id: 137 },
//       { name: "Dr. Beckmann", id: 107 },
//       { name: "Viakal", id: 143 },
//       { name: "Omino Bianco", id: 111 },
//       { name: "Gillette", id: 130 },
//       { name: "Dual Power", id: 92 },
//       { name: "Spuma di Sciampagna", id: 105 },
//       { name: "Fabuloso", id: 163 },
//       { name: "Sole", id: 117 },
//       { name: "Leocrema", id: 118 },
//       { name: "Finish", id: 100 },
//       { name: "Grey", id: 110 },
//       { name: "Quasar", id: 136 },
//       { name: "DIXAN", id: 94 },
//       { name: "Mon Amour", id: 156 },
//       { name: "Orphea", id: 90 },
//       { name: "Vernel", id: 155 },
//       { name: "WC NET", id: 121 },
//       { name: "NUNCAS", id: 89 },
//       { name: "Fairy", id: 101 },
//       { name: "Cif", id: 85 },
//       { name: "Mister Magic", id: 138 },
//       { name: "Svelto", id: 106 },
//       { name: "Emulsio", id: 96 },
//       { name: "Nivea", id: 176 },
//       { name: "Scrub Daddy", id: 161 },
//       { name: "Mister Proper", id: 171 },
//       { name: "mil mil", id: 93 },
//       { name: "Nelsen", id: 150 },
//       { name: "bio Presto", id: 135 },
//       { name: "Swiffer", id: 166 },
//       { name: "Colgate", id: 182 },
//       { name: "i Provenziali", id: 120 },
//       { name: "Pronto", id: 109 },
//       { name: "Pril / Somat", id: 141 },
//       { name: "BOROTALCO", id: 178 },
//       { name: "Coccolino", id: 88 },
//       { name: "Brawn", id: 119 },
//       { name: "Labello", id: 147 },
//       { name: "Lysoform", id: 123 },
//       { name: "Soft", id: 112 },
//       { name: "Amuchina", id: 114 },
//       { name: "Autan", id: 132 },
//       { name: "Breeze", id: 108 },
//       { name: "Garnier", id: 126 },
//       { name: "Sunsilk", id: 128 },
//       { name: "Scholl", id: 129 },
//       { name: "Passion Gold", id: 158 },
//       { name: "Genera", id: 134 },
//       { name: "Pasta del Capitano", id: 99 },
//       { name: "Atkinsons 1799", id: 151 },
//       { name: "Listerine", id: 139 },
//       { name: "Sensodyne", id: 145 },
//       { name: "Sauber", id: 146 },
//       { name: "Antica Erboristeria", id: 91 },
//       { name: "Fresh Passion", id: 152 },
//       { name: "Smapiu", id: 159 },
//       { name: "Napisan", id: 153 },
//       { name: "General Fresh", id: 162 },
//       { name: "Dove", id: 183 },
//       { name: "General", id: 164 },
//       { name: "LUX", id: 170 },
//       { name: "Denivit", id: 172 },
//       { name: "Cotoneve", id: 174 },
//       { name: "CLEAR", id: 177 },
//       { name: "Regina", id: 142 },
//       { name: "SMAC", id: 179 },
//       { name: "Herbal Essences", id: 181 },
//       { name: "Dermomed", id: 184 },
//       { name: "PalmPro", id: 154 },
//       { name: "Proraso", id: 185 },
//       { name: "Elmex", id: 186 },
//       { name: "BlanX", id: 187 },
//       { name: "Smacchio Tutto", id: 188 },
//       { name: "Marvis", id: 189 },
//       { name: "Vanish", id: 190 },
//       { name: "L' Angelica", id: 191 },
//       { name: "Air Wick", id: 192 },
//       { name: "Ariasana", id: 193 },
//       { name: "AZ / Oral B", id: 194 },
//       { name: "Toffly", id: 195 },
//       { name: "Carta Corona", id: 196 },
//       { name: "Vetril", id: 197 },
//       { name: "Chilly", id: 198 },
//       { name: "Podovis", id: 199 },
//       { name: "Dolorelax", id: 200 },
//       { name: "Chicco", id: 201 },
//       { name: "Persil", id: 206 },
//       { name: "Dettol", id: 207 },
//       { name: "Domestos", id: 208 },
//       { name: "Old Spice", id: 209 },
//       { name: "Bold", id: 211 },
//       { name: "Elbow Grease", id: 212 },
//       { name: "Swirl", id: 213 },
//       { name: "Tide", id: 214 },
//       { name: "Surf", id: 215 },
//       { name: "Skip", id: 216 },
//       { name: "Neutradol", id: 217 },
//       { name: "Bref", id: 218 },
//       { name: "Goodyear", id: 220 },
//       { name: "Purox", id: 223 },
//       { name: "XBC（Xpel Body Care)", id: 225 },
//       { name: "Perwoll", id: 226 },
//       { name: "Ajax", id: 230 },
//       { name: "Nuvenia", id: 227 },
//       { name: "Carefree", id: 228 },
//       { name: "Malizia Bon Bons", id: 229 },
//     ],
//   },
  {
    name: "Грижа за Дома",
    id: 4,
    children: [
      { name: "Парфюми и Ароматизатори", id: 13 },
      { name: "Подове + Повърхности", id: 12 },
      { name: "Кухня", id: 18 },
      { name: "Баня и Тоалетна", id: 19 },
      { name: "Аксесоари за Почистване", id: 167 },
      { name: "Други", id: 77 },
      { name: "Хигиенизанти", id: 73 },
      { name: "Домашни Любимци", id: 210 },
    ],
  },
  {
    name: "Пране - Всичко Необходимо",
    id: 3,
    children: [
      { name: "Омекотители", id: 28 },
      { name: "Препарати за Пране", id: 26 },
      { name: "Парфюми, Есенции и Перли за Пране", id: 35 },
      { name: "Добавки и Грижа за Прането", id: 27 },
      { name: "Единични Дози за Пране", id: 52 },
    ],
  },
  {
    name: "Мама + Дете",
    id: 10,
    children: [
      { name: "Препарати без Алергени", id: 11 },
      { name: "Омекотители без Алергени", id: 67 },
      { name: "Ароматизатори без Алергени", id: 68 },
      { name: "Коса/Тяло/Лице без Алергени", id: 75 },
    ],
  },
  {
    name: "Коса / Тяло / Лице",
    id: 7,
    children: [
      { name: "Продукти за Коса", id: 41 },
      { name: "Продукти за Тяло", id: 42 },
      { name: "Лице", id: 43 },
      { name: "Сапуни", id: 37 },
    ],
  },
  { name: "Професионални Продукти", id: 48 },
];
