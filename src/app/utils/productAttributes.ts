export interface ResolvedAttribute {
  code: string;
  label: string;
  value: string;
}

// Ordered list — controls display order and which attributes appear in the table
export const CUSTOM_ATTRIBUTE_CODES = [
  "Broi",
  "broj_izmivanija",
  "broj_cikli_upotreba",
  "broj_cikli_sushene",
  "aromat",
  "aromati",
  "aromat_dush_gel_2",
  "aromat_sapuni",
  "proizhod",
  "dejstvie",
  "dejstvie_dushgel_multiple",
  "dejstvie_dush_gel",
  "marki",
  "razfasovka",
  "obem_kapacitet",
  "razmer",
  "vid_materii",
  "materii_s_vmestimost_2",
  "material_na_izrabotka",
  "prilozhenie",
  "podhodjascho_za",
  "podhodjascho_za_hrani",
  "koli_garderobi_prilozhenie",
  "tip_vero",
  "tip_kosa",
  "kosa",
  "tip_podove_pov_rhnosti",
  "tip_podove_pov_rhnosti_2",
  "tip_kuhnenska_prinadlejnost",
  "tip_zatvarjane",
  "tretirane_na_petna_ot",
  "mozhe_da_se_izpolzva_v",
  "d_lgotrajnost",
  "temperaturna_ustojchivost",
  "svojstva",
  "cvjat",
] as const;

const ATTRIBUTE_LABELS: Record<string, string> = {
  Broi: "Брой",
  broj_izmivanija: "Брой измивания",
  broj_cikli_upotreba: "Брой цикли употреба",
  broj_cikli_sushene: "Брой цикли сушене",
  aromat: "Аромат",
  aromati: "Аромат",
  aromat_dush_gel_2: "Аромат (Душ Гел)",
  aromat_sapuni: "Аромат (Сапуни)",
  proizhod: "Държава произход",
  dejstvie: "Действие",
  dejstvie_dushgel_multiple: "Действие",
  dejstvie_dush_gel: "Действие (Душ Гел)",
  marki: "Марка",
  razfasovka: "Опаковка",
  obem_kapacitet: "Обем / Капацитет",
  razmer: "Размер",
  vid_materii: "Вид / Предназначение",
  materii_s_vmestimost_2: "Материи",
  material_na_izrabotka: "Материал на изработка",
  prilozhenie: "Приложение",
  podhodjascho_za: "Подходящо за",
  podhodjascho_za_hrani: "Подходящо за (Храни)",
  koli_garderobi_prilozhenie: "Коли / Гардероби",
  tip_vero: "Тип веро",
  tip_kosa: "Тип коса",
  kosa: "Коса",
  tip_podove_pov_rhnosti: "Тип подове / Повърхности",
  tip_podove_pov_rhnosti_2: "Тип подове / Повърхности",
  tip_kuhnenska_prinadlejnost: "Тип кухненска принадлежност",
  tip_zatvarjane: "Тип затваряне",
  tretirane_na_petna_ot: "Третиране на петна от",
  mozhe_da_se_izpolzva_v: "Може да се използва в",
  d_lgotrajnost: "Дълготрайност",
  temperaturna_ustojchivost: "Температурна устойчивост",
  svojstva: "Свойства",
  cvjat: "Цвят",
};

export interface AttributeMetadataItem {
  attribute_code: string;
  attribute_options: { label: string; value: string }[] | null;
}

// Build a lookup: { [code]: { [optionValue]: label } }
export function buildOptionMap(
  items: AttributeMetadataItem[],
): Record<string, Record<string, string>> {
  const map: Record<string, Record<string, string>> = {};
  for (const item of items) {
    if (!item.attribute_options) continue;
    map[item.attribute_code] = {};
    for (const opt of item.attribute_options) {
      map[item.attribute_code][opt.value] = opt.label;
    }
  }
  return map;
}

export function resolveProductAttributes(
  rawProduct: Record<string, unknown>,
  optionMap: Record<string, Record<string, string>>,
): ResolvedAttribute[] {
  const result: ResolvedAttribute[] = [];

  for (const code of CUSTOM_ATTRIBUTE_CODES) {
    const raw = rawProduct[code];
    if (raw === null || raw === undefined || raw === "") continue;

    const label = ATTRIBUTE_LABELS[code];
    if (!label) continue;

    const options = optionMap[code];
    let value: string;

    if (options) {
      // Select or multiselect — raw is a number or comma-separated string of IDs
      const ids = String(raw).split(",").map((s) => s.trim());
      const labels = ids.map((id) => options[id] ?? id).filter(Boolean);
      if (!labels.length) continue;
      value = labels.join(", ");
    } else {
      // Plain text attribute
      value = String(raw);
    }

    result.push({ code, label, value });
  }

  return result;
}
