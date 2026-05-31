import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { verifyTurnstile } from "@/src/app/utils/turnstile";

const SECRET = process.env.REVALIDATE_SECRET;
const REST_BASE = (process.env.GRAPHQL_URL ?? "").replace(/\/graphql$/, "/rest/V1");

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAdminToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token;
  const res = await fetch(`${REST_BASE}/integration/admin/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: process.env.MAGENTO_ADMIN_USER,
      password: process.env.MAGENTO_ADMIN_PASSWORD,
    }),
  });
  if (!res.ok) throw new Error(`Admin token failed: ${res.status}`);
  const token: string = await res.json();
  tokenCache = { token, expiresAt: Date.now() + 3 * 60 * 60 * 1000 };
  return token;
}

// Magento expects "YYYY-MM-DD HH:MM:SS" not ISO 8601.
function toMagentoDate(iso: string): string {
  return iso.replace("T", " ").split(".")[0];
}

type MagentoProduct = {
  updated_at?: string;
  custom_attributes?: { attribute_code: string; value: string }[];
  extension_attributes?: { category_links?: { category_id: string }[] };
};

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  if (!SECRET || searchParams.get("secret") !== SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body: { since?: string; cfToken?: string } = await request.json().catch(() => ({}));

  if (!body.cfToken || !(await verifyTurnstile(body.cfToken))) {
    return NextResponse.json({ message: "Invalid CAPTCHA" }, { status: 400 });
  }

  // "today" = midnight UTC, "24h" = rolling last 24h, anything else = literal ISO string
  let since: Date;
  if (!body.since || body.since === "today") {
    const now = new Date();
    since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  } else if (body.since === "24h") {
    since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  } else {
    since = new Date(body.since);
    if (isNaN(since.getTime())) {
      return NextResponse.json({ message: "Invalid since value" }, { status: 400 });
    }
  }

  let token: string;
  try {
    token = await getAdminToken();
  } catch (e) {
    return NextResponse.json({ message: String(e) }, { status: 502 });
  }

  const params = new URLSearchParams({
    "searchCriteria[filterGroups][0][filters][0][field]": "updated_at",
    "searchCriteria[filterGroups][0][filters][0][value]": toMagentoDate(since.toISOString()),
    "searchCriteria[filterGroups][0][filters][0][condition_type]": "gt",
    "searchCriteria[pageSize]": "500",
    "fields": "items[updated_at,custom_attributes,extension_attributes[category_links]]",
  });

  const res = await fetch(`${REST_BASE}/products?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ message: `Magento error: ${res.status}` }, { status: 502 });
  }

  const data: { items: MagentoProduct[] } = await res.json();
  const products = data.items ?? [];

  const tags: string[] = [];
  const categoryIds = new Set<string>();

  for (const p of products) {
    const urlKey = p.custom_attributes?.find((a) => a.attribute_code === "url_key")?.value;
    const tag = urlKey ? `product:${urlKey}` : null;
    if (tag && tag.length <= 256) {
      revalidateTag(tag, "max");
      tags.push(tag);
    }
    for (const link of p.extension_attributes?.category_links ?? []) {
      categoryIds.add(link.category_id);
    }
  }

  for (const id of categoryIds) {
    revalidateTag(`products:category:${id}`, "max");
    tags.push(`products:category:${id}`);
  }

  if (products.length > 0) {
    revalidateTag("products", "max");
    tags.push("products");
  }

  return NextResponse.json({ revalidated: true, since: since.toISOString(), productCount: products.length, tags });
}
