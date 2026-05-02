export const MAGENTO_REST = (process.env.GRAPHQL_URL ?? "").replace(/\/graphql\/?$/, "") + "/rest/V1";

let cachedToken: string | null = null;
let tokenExpiry = 0;

export async function getAdminToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch(`${MAGENTO_REST}/integration/admin/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: process.env.MAGENTO_ADMIN_USER,
      password: process.env.MAGENTO_ADMIN_PASSWORD,
    }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Admin token failed ${res.status}: ${text}`);

  cachedToken = JSON.parse(text);
  tokenExpiry = Date.now() + 3 * 60 * 60 * 1000;
  return cachedToken!;
}
