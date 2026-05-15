import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const MAGENTO_URL = (process.env.GRAPHQL_URL ?? "").replace("/graphql", "");

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth-token")?.value;

  if (!authToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mageSession = cookieStore.get("mage-session")?.value;
  const mageFormKey = cookieStore.get("mage-form-key")?.value;

  if (!mageSession || !mageFormKey) {
    return NextResponse.json(
      { error: "Magento session not available — please log out and log in again" },
      { status: 400 },
    );
  }

  const { productId } = await request.json();
  if (!productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  // uenc is just a base64-encoded "return to" URL — Magento uses it for redirect after add.
  // We never follow the redirect so any valid URL works.
  const uenc = Buffer.from(`${MAGENTO_URL}/wishlist`).toString("base64url");

  const resp = await fetch(`${MAGENTO_URL}/wishlist/index/add/`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: `PHPSESSID=${mageSession}; form_key=${mageFormKey}`,
    },
    body: new URLSearchParams({
      product: String(productId),
      uenc,
      form_key: mageFormKey,
    }).toString(),
  });

  // Magento returns 302 on success (redirect back to the page)
  if (resp.status === 302 || resp.ok) {
    return NextResponse.json({ success: true });
  }

  const text = await resp.text();
  console.error("Magento wishlist add error:", resp.status, text.slice(0, 300));
  return NextResponse.json({ error: "Failed to add to wishlist" }, { status: 500 });
}
