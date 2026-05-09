export interface CartPrices {
  grand_total: {
    value: number;
    currency: string;
  };
  subtotal_excluding_tax: {
    value: number;
    currency: string;
  };
}

export interface CartProductImage {
  url: string;
  label: string;
}

export interface CartProductPrice {
  final_price: {
    value: number;
    currency: string;
  };
}

export interface CartProduct {
  id: string;
  name: string;
  sku: string;
  thumbnail: CartProductImage;
  price_range: {
    minimum_price: CartProductPrice;
  };
  url_key: string;
}

export interface CartItem {
  id: string;
  quantity: number;
  prices: {
    price: {
      value: number;
      currency: string;
    };
  };
  product: CartProduct;
}

export interface Cart {
  id: string;
  email: string | null;
  total_quantity: number;
  prices: CartPrices;
  items: CartItem[];
}

export interface AddToCartInput {
  sku: string;
  quantity: number;
}

export interface RemoveFromCartInput {
  cartItemId: number;
}

export interface UpdateCartItemInput {
  cartItemId: number;
  quantity: number;
}
