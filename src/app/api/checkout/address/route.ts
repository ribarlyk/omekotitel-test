import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Mutations } from "@/src/app/utils/graphql";
import { print } from "graphql";

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL ?? "";

interface ShippingAddress {
  firstname: string;
  lastname: string;
  street: string;
  city: string;
  region: string;
  postcode: string;
  country_code: string;
  telephone: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!GRAPHQL_ENDPOINT) {
      return NextResponse.json({ message: "Server not configured" }, { status: 500 });
    }

    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const cartId = cookieStore.get("cart-id")?.value;

    if (!cartId) {
      return NextResponse.json({ message: "No cart found" }, { status: 404 });
    }

    const { email, shippingAddress }: { email?: string; shippingAddress: ShippingAddress } =
      await request.json();

    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    // Set guest email (only for unauthenticated users)
    if (!authToken && email) {
      const emailResp = await fetch(GRAPHQL_ENDPOINT, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: print(Mutations.SET_GUEST_EMAIL_ON_CART),
          variables: { cartId, email },
        }),
      });
      const emailData = await emailResp.json();
      if (emailData.errors) {
        return NextResponse.json(
          { message: emailData.errors[0]?.message ?? "Failed to set email" },
          { status: 400 }
        );
      }
    }

    // Set shipping address — response includes available_shipping_methods
    const addrResp = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: print(Mutations.SET_SHIPPING_ADDRESSES_ON_CART),
        variables: {
          cartId,
          firstname: shippingAddress.firstname,
          lastname: shippingAddress.lastname,
          street: [shippingAddress.street],
          city: shippingAddress.city,
          region: shippingAddress.region,
          postcode: shippingAddress.postcode,
          country_code: shippingAddress.country_code,
          telephone: shippingAddress.telephone,
        },
      }),
    });
    const addrData = await addrResp.json();
    if (addrData.errors) {
      return NextResponse.json(
        { message: addrData.errors[0]?.message ?? "Failed to set shipping address" },
        { status: 400 }
      );
    }

    const shippingMethods =
      addrData.data?.setShippingAddressesOnCart?.cart?.shipping_addresses?.[0]
        ?.available_shipping_methods ?? [];

    // Fetch available payment methods
    const pmResp = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: `query GetPaymentMethods($cartId: String!) {
          cart(cart_id: $cartId) {
            available_payment_methods {
              code
              title
            }
          }
        }`,
        variables: { cartId },
      }),
    });
    const pmData = await pmResp.json();
    // Filter out banktransfer — it is reserved as the internal bridge for Revolut Pay orders
    const paymentMethods = (pmData.data?.cart?.available_payment_methods ?? []).filter(
      (m: { code: string }) => m.code !== "banktransfer"
    );

    return NextResponse.json({ shippingMethods, paymentMethods });
  } catch (error) {
    console.error("/api/checkout/address error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Checkout address step failed" },
      { status: 500 }
    );
  }
}
