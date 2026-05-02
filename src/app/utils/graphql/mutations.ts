import CREATE_CART_AFTER_SIGNIN from "@/src/app/qraphql/mutation/create-cart-after-signin.graphql";
import GENERATE_AUTH_TOKEN from "@/src/app/qraphql/mutation/generate-customer-token.graphql";
import REVOKE_CUSTOMER_TOKEN from "@/src/app/qraphql/mutation/revoke-customer-token.graphql";
import CREATE_CUSTOMER from "@/src/app/qraphql/mutation/create-customer.graphql";
import CREATE_EMPTY_CART from "@/src/app/qraphql/mutation/create-empty-cart.graphql";
import ADD_PRODUCT_TO_CART from "@/src/app/qraphql/mutation/add-product-to-cart.graphql";
import MERGE_CARTS from "@/src/app/qraphql/mutation/merge-carts.graphql";
import REMOVE_ITEM_FROM_CART from "@/src/app/qraphql/mutation/remove-item-from-cart.graphql";
import UPDATE_CART_ITEM_QUANTITY from "@/src/app/qraphql/mutation/update-cart-item-quantity.graphql";
import SET_GUEST_EMAIL_ON_CART from "@/src/app/qraphql/mutation/set-guest-email-on-cart.graphql";
import SET_SHIPPING_ADDRESSES_ON_CART from "@/src/app/qraphql/mutation/set-shipping-addresses-on-cart.graphql";
import SET_SHIPPING_METHOD_ON_CART from "@/src/app/qraphql/mutation/set-shipping-method-on-cart.graphql";
import SET_BILLING_SAME_AS_SHIPPING from "@/src/app/qraphql/mutation/set-billing-same-as-shipping.graphql";
import SET_BILLING_ADDRESS_ON_CART from "@/src/app/qraphql/mutation/set-billing-address-on-cart.graphql";
import SET_PAYMENT_METHOD_ON_CART from "@/src/app/qraphql/mutation/set-payment-method-on-cart.graphql";
import PLACE_ORDER from "@/src/app/qraphql/mutation/place-order.graphql";
import UPDATE_CUSTOMER from "@/src/app/qraphql/mutation/update-customer.graphql";
import CHANGE_CUSTOMER_PASSWORD from "@/src/app/qraphql/mutation/change-customer-password.graphql";
import CREATE_CUSTOMER_ADDRESS from "@/src/app/qraphql/mutation/create-customer-address.graphql";
import UPDATE_CUSTOMER_ADDRESS from "@/src/app/qraphql/mutation/update-customer-address.graphql";
import DELETE_CUSTOMER_ADDRESS from "@/src/app/qraphql/mutation/delete-customer-address.graphql";

export const Mutations = {
  CREATE_CART_AFTER_SIGNIN,
  CREATE_CUSTOMER,
  GENERATE_AUTH_TOKEN,
  REVOKE_CUSTOMER_TOKEN,
  CREATE_EMPTY_CART,
  ADD_PRODUCT_TO_CART,
  MERGE_CARTS,
  REMOVE_ITEM_FROM_CART,
  UPDATE_CART_ITEM_QUANTITY,
  SET_GUEST_EMAIL_ON_CART,
  SET_SHIPPING_ADDRESSES_ON_CART,
  SET_SHIPPING_METHOD_ON_CART,
  SET_BILLING_SAME_AS_SHIPPING,
  SET_BILLING_ADDRESS_ON_CART,
  SET_PAYMENT_METHOD_ON_CART,
  PLACE_ORDER,
  UPDATE_CUSTOMER,
  CHANGE_CUSTOMER_PASSWORD,
  CREATE_CUSTOMER_ADDRESS,
  UPDATE_CUSTOMER_ADDRESS,
  DELETE_CUSTOMER_ADDRESS,
};
