interface ConfigurableOptionValue {
  label: string;
  value_index: number;
}

interface ConfigurableOption {
  attribute_code: string;
  values: ConfigurableOptionValue[];
}

interface UnitPrice {
  formatted: string;
  unit: string;
}

// \b doesn't work with Cyrillic in JS regex (Cyrillic chars are \W), so use (?=\s|$|[^\wа-яА-ЯёЁ]) lookahead instead
const CYR_END = '(?=\\s|$|[^а-яА-ЯёЁ])';
const cyrUnit = (u: string) => new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*${u}${CYR_END}`, 'i');

const PATTERNS: { regex: RegExp; toBase: (n: number) => number; unit: string; minQty?: number }[] = [
  // Millilitres → price per litre
  { regex: cyrUnit('мл'), toBase: (n) => n / 1000, unit: 'л' },
  { regex: /(\d+(?:[.,]\d+)?)\s*ml\b/i, toBase: (n) => n / 1000, unit: 'л' },
  // Litres → price per litre (л, лт, литр, литра)
  { regex: cyrUnit('л(?:т|итра?)?'), toBase: (n) => n, unit: 'л' },
  { regex: /(\d+(?:[.,]\d+)?)\s*l(?:itre?)?\b/i, toBase: (n) => n, unit: 'л' },
  // Grams → price per kg
  { regex: cyrUnit('г'), toBase: (n) => n / 1000, unit: 'кг' },
  { regex: /(\d+(?:[.,]\d+)?)\s*g\b/i, toBase: (n) => n / 1000, unit: 'кг' },
  // Kilograms → price per kg
  { regex: cyrUnit('кг'), toBase: (n) => n, unit: 'кг' },
  { regex: /(\d+(?:[.,]\d+)?)\s*kg\b/i, toBase: (n) => n, unit: 'кг' },
  // Count — only useful when > 1 (matches: бр, бр., брой, броя, броят)
  { regex: cyrUnit('бр(?:ой|оя|оят)?\\.?'), toBase: (n) => n, unit: 'бр', minQty: 2 },
];

export function calcUnitPrice(
  selectedOptions: Record<string, number>,
  configurableOptions: ConfigurableOption[],
  price: number,
  currency: string,
): UnitPrice | null {
  const labels = configurableOptions
    .map((opt) => {
      const idx = selectedOptions[opt.attribute_code];
      if (idx === undefined) return null;
      return opt.values.find((v) => v.value_index === idx)?.label ?? null;
    })
    .filter(Boolean) as string[];

  if (!labels.length) return null;

  const text = labels.join(' ');

  for (const { regex, toBase, unit, minQty } of PATTERNS) {
    const match = text.match(regex);
    if (!match) continue;
    const qty = parseFloat(match[1].replace(',', '.'));
    if (!qty || qty <= 0) continue;
    if (minQty !== undefined && qty < minQty) continue;
    const base = toBase(qty);
    if (base <= 0) continue;
    const unitPrice = price / base;
    return { formatted: unitPrice.toFixed(2), unit };
  }

  return null;
}
