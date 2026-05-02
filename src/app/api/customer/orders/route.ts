import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminToken, MAGENTO_REST } from "@/src/app/utils/magentoAdmin";

const REST = (process.env.GRAPHQL_URL ?? "").replace(/\/graphql\/?$/, "") + "/rest/V1";

async function getCustomerId(token: string): Promise<number | null> {
  const res = await fetch(`${REST}/customers/me`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.id ?? null;
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const page = req.nextUrl.searchParams.get("page") ?? "1";
  const pageSize = req.nextUrl.searchParams.get("pageSize") ?? "10";

  try {
    const [customerId, adminToken] = await Promise.all([
      getCustomerId(token),
      getAdminToken(),
    ]);

    if (!customerId) return NextResponse.json({ error: "Could not identify customer" }, { status: 401 });

    const params = new URLSearchParams({
      "searchCriteria[filter_groups][0][filters][0][field]": "customer_id",
      "searchCriteria[filter_groups][0][filters][0][value]": String(customerId),
      "searchCriteria[filter_groups][0][filters][0][condition_type]": "eq",
      "searchCriteria[pageSize]": pageSize,
      "searchCriteria[currentPage]": page,
      "searchCriteria[sortOrders][0][field]": "created_at",
      "searchCriteria[sortOrders][0][direction]": "DESC",
    });

    const res = await fetch(`${MAGENTO_REST}/orders?${params}`, {
      headers: { Authorization: `Bearer ${adminToken}`, Accept: "application/json" },
      cache: "no-store",
    });

    const text = await res.text();
    if (!res.ok) return NextResponse.json({ error: `Magento ${res.status}`, detail: text }, { status: res.status });

    return NextResponse.json(JSON.parse(text));
  } catch (err) {
    console.error("[orders]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
