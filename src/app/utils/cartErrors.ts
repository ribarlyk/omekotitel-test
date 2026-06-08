/**
 * True when a Magento GraphQL error means the cart-id cookie is no longer usable in the
 * current auth context — e.g. a customer cart used after logout, or after the auth token
 * expired. Magento reports this as:
 *   "The current user cannot perform operations on cart \"<id>\""  (category: graphql-authorization)
 *
 * Distinguishing this from a transient error matters: on a transient blip we must KEEP the
 * cart-id (the cart is still valid), but on this error we must drop it and create a fresh one.
 */
export function isCartAuthError(errors: unknown): boolean {
  if (!Array.isArray(errors)) return false;
  return errors.some((e) => {
    const category = (e as { extensions?: { category?: string } })?.extensions?.category;
    const message = (e as { message?: string })?.message ?? "";
    return category === "graphql-authorization" || /cannot perform operations on cart/i.test(message);
  });
}
