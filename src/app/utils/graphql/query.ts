import GET_CATALOG from "@/src/app/qraphql/query/get-category-tree.graphql";
import GET_PRODUCT_DETAIL from "@/src/app/qraphql/query/get-product-detail.graphql";
import GET_PRODUCTS_BY_CATEGORY from "@/src/app/qraphql/query/get-products-by-category.graphql";
import GET_CUSTOMER_CART from "@/src/app/qraphql/query/get-customer-cart.graphql";
import GET_CUSTOMER from "@/src/app/qraphql/query/get-customer.graphql";
import GET_CUSTOMER_WISHLIST from "@/src/app/qraphql/query/get-customer-wishlist.graphql";
import SEARCH_PRODUCTS from "@/src/app/qraphql/query/search-products.graphql";

export const Queries = {
  GET_CATALOG,
  GET_PRODUCT_DETAIL,
  GET_PRODUCTS_BY_CATEGORY,
  GET_CUSTOMER_CART,
  GET_CUSTOMER,
  GET_CUSTOMER_WISHLIST,
  SEARCH_PRODUCTS,
};
