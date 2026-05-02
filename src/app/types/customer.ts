export interface CustomerAddress {
  id: number;
  firstname: string;
  lastname: string;
  street: string[];
  city: string;
  region: { region: string } | null;
  postcode: string;
  country_code: string;
  telephone: string;
  default_billing: boolean;
  default_shipping: boolean;
}

export interface CustomerOrder {
  number: string;
  order_date: string;
  status: string;
  grand_total: { value: number; currency: string };
  shipping_address: { firstname: string; lastname: string };
}

export interface CustomerAccount {
  firstname: string;
  lastname: string;
  email: string;
  is_subscribed: boolean;
  addresses: CustomerAddress[];
  orders?: {
    items: CustomerOrder[];
  };
}
