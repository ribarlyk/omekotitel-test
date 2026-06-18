import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Queries } from "@/src/app/utils/graphql";
import { print } from "graphql";

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL ?? "";
const REVOLUT_API_SECRET_KEY = process.env.REVOLUT_API_SECRET_KEY ?? "";
const REVOLUT_ENV = process.env.NEXT_PUBLIC_REVOLUT_ENV ?? "sandbox";

const REVOLUT_API_BASE =
  REVOLUT_ENV === "sandbox"
    ? "https://sandbox-merchant.revolut.com/api"
    : "https://merchant.revolut.com/api";

export async function POST(request: Request) {
  try {
    if (!REVOLUT_API_SECRET_KEY) {
      return NextResponse.json(
        { message: "Revolut API key not configured" },
        { status: 500 }
      );
    }

    // Magento's grand_total omits shipping until the method is set on the cart (deferred
    // to order placement), so the client passes the selected method's cost to include it
    // in the charge. Validated to a sane, non-negative number.
    const body = await request.json().catch(() => ({}));
    const rawShipping = (body as { shippingAmount?: unknown }).shippingAmount;
    const shippingAmount =
      typeof rawShipping === "number" && isFinite(rawShipping) && rawShipping >= 0 && rawShipping < 100000
        ? rawShipping
        : 0;

    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token")?.value;
    const cartId = cookieStore.get("cart-id")?.value;

    if (!cartId) {
      return NextResponse.json({ message: "No cart found" }, { status: 404 });
    }

    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    // Fetch cart to get the grand total
    const cartResp = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: print(Queries.GET_CUSTOMER_CART),
        variables: { cartId },
      }),
    });
    const cartData = await cartResp.json();
    const cart = cartData.data?.cart;

    if (!cart) {
      return NextResponse.json({ message: "Could not fetch cart" }, { status: 400 });
    }

    const amountMinor = Math.round((cart.prices.grand_total.value + shippingAmount) * 100);
    const currency = cart.prices.grand_total.currency;

    // Create order via Revolut Merchant API to get the widget token
    const revolutResp = await fetch(`${REVOLUT_API_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${REVOLUT_API_SECRET_KEY}`,
        "Revolut-Api-Version": "2024-09-01",
      },
      body: JSON.stringify({
        amount: amountMinor,
        currency,
        // Authorize only — funds are held, not charged. Capture happens later
        // (manually in the Revolut dashboard). Card authorizations expire after ~7 days.
        capture_mode: "manual",
        description: "Поръчка от omekotitel.bg",
        // Force 3D Secure authentication for testing
        enforcement_options: {
          three_d_secure: {
            enabled: true,
            enforce: true,
          },
        },
      }),
    });

    if (!revolutResp.ok) {
      const err = await revolutResp.json().catch(() => ({}));
      console.error("Revolut API error:", err);
      return NextResponse.json(
        { message: err.message ?? "Failed to create Revolut order" },
        { status: 400 }
      );
    }

    const revolutOrder = await revolutResp.json();
    // Pay 2.0 widget needs the `token` field
    const publicId = revolutOrder.token ?? revolutOrder.public_id ?? revolutOrder.publicId;

    return NextResponse.json({ publicId, orderId: revolutOrder.id });
  } catch (error) {
    console.error("/api/checkout/revolut-order error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create Revolut order" },
      { status: 500 }
    );
  }
}
