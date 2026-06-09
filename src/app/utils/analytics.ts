import { sendGAEvent } from "@next/third-parties/google";

type GAItem = {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_category?: string;
};

type SimpleItem = {
  sku: string;
  name: string;
  price: number;
  quantity: number;
};

function toGAItem(i: SimpleItem): GAItem {
  return { item_id: i.sku, item_name: i.name, price: i.price, quantity: i.quantity };
}

export function trackViewItem(product: {
  sku: string;
  name: string;
  price: number;
  currency: string;
  category?: string;
}) {
  sendGAEvent("event", "view_item", {
    currency: product.currency,
    value: product.price,
    items: [{ item_id: product.sku, item_name: product.name, price: product.price, quantity: 1, item_category: product.category }],
  });
}

export function trackAddToCart(item: {
  sku: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
}) {
  sendGAEvent("event", "add_to_cart", {
    currency: item.currency,
    value: item.price * item.quantity,
    items: [toGAItem(item)],
  });
}

export function trackRemoveFromCart(item: {
  sku: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
}) {
  sendGAEvent("event", "remove_from_cart", {
    currency: item.currency,
    value: item.price * item.quantity,
    items: [toGAItem(item)],
  });
}

export function trackViewItemList(params: {
  listName: string;
  currency: string;
  items: SimpleItem[];
}) {
  sendGAEvent("event", "view_item_list", {
    item_list_name: params.listName,
    currency: params.currency,
    items: params.items.map(toGAItem),
  });
}

export function trackBeginCheckout(params: {
  value: number;
  currency: string;
  items: SimpleItem[];
}) {
  sendGAEvent("event", "begin_checkout", {
    currency: params.currency,
    value: params.value,
    items: params.items.map(toGAItem),
  });
}

export function trackAddShippingInfo(params: {
  value: number;
  currency: string;
  shippingTier: string;
  items: SimpleItem[];
}) {
  sendGAEvent("event", "add_shipping_info", {
    currency: params.currency,
    value: params.value,
    shipping_tier: params.shippingTier,
    items: params.items.map(toGAItem),
  });
}

export function trackAddPaymentInfo(params: {
  value: number;
  currency: string;
  paymentType: string;
  items: SimpleItem[];
}) {
  sendGAEvent("event", "add_payment_info", {
    currency: params.currency,
    value: params.value,
    payment_type: params.paymentType,
    items: params.items.map(toGAItem),
  });
}

export function trackPurchase(params: {
  orderId: string;
  value: number;
  currency: string;
  shipping: number;
  items: SimpleItem[];
}) {
  sendGAEvent("event", "purchase", {
    transaction_id: params.orderId,
    currency: params.currency,
    value: params.value,
    shipping: params.shipping,
    items: params.items.map(toGAItem),
  });
}

export function trackLogin() {
  sendGAEvent("event", "login", { method: "email" });
}

export function trackSignUp() {
  sendGAEvent("event", "sign_up", { method: "email" });
}

export function trackSearch(term: string) {
  sendGAEvent("event", "search", { search_term: term });
}
