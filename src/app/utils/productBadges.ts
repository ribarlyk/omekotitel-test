interface PriceDiscount {
  percent_off: number;
  amount_off: number;
}

interface MinimumPrice {
  final_price: { value: number; currency: string };
  regular_price?: { value: number; currency: string };
  discount?: PriceDiscount | null;
}

interface PriceRange {
  minimum_price: MinimumPrice;
}

interface BadgeFields {
  price_range?: PriceRange | null;
  new_from_date?: string | null;
  new_to_date?: string | null;
}

export function isProductNew(fields: Pick<BadgeFields, "new_from_date" | "new_to_date">, now = new Date()): boolean {
  if (!fields.new_from_date) return false;
  return (
    new Date(fields.new_from_date) <= now &&
    (!fields.new_to_date || new Date(fields.new_to_date) >= now)
  );
}

// Magento's discount.percent_off is the ground truth — it's 0 when no discount
// is active (special price expired, no catalog rule), > 0 when a discount applies.
export function isProductOnSale(fields: BadgeFields): boolean {
  const discount = fields.price_range?.minimum_price.discount;
  return !!(discount && discount.percent_off > 0);
}

export function discountPercent(fields: BadgeFields): number {
  const discount = fields.price_range?.minimum_price.discount;
  if (!discount || discount.percent_off <= 0) return 0;
  return Math.round(discount.percent_off);
}
