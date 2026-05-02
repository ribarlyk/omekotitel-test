import { NextRequest, NextResponse } from "next/server";
import { verifyTurnstile } from "@/src/app/utils/turnstile";

const MAGENTO_BASE = (process.env.GRAPHQL_URL ?? "").replace("/graphql", "");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitize(value: string): string {
  return value.replace(/[<>"']/g, "").trim();
}

function validateString(value: unknown, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLen) return null;
  return trimmed;
}

function extractCookieValues(setCookieHeader: string): string {
  return setCookieHeader
    .split(/,(?=[^ ].*?=)/)
    .map((c) => c.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");
}

export async function POST(request: NextRequest) {
  if (!MAGENTO_BASE) {
    console.error("contact: GRAPHQL_URL is not configured");
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  try {
    const raw = await request.json();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const body = raw as Record<string, unknown>;

    const name = validateString(body.name, 100);
    const email = validateString(body.email, 254);
    const comment = validateString(body.comment, 2000);
    const telephone = typeof body.telephone === "string" ? body.telephone.trim().slice(0, 30) : "";

    if (!name) return NextResponse.json({ error: "Името е задължително" }, { status: 400 });
    if (!email || !EMAIL_RE.test(email)) return NextResponse.json({ error: "Невалиден имейл" }, { status: 400 });
    if (!comment) return NextResponse.json({ error: "Съобщението е задължително" }, { status: 400 });

    const cfToken = body.cfToken;
    if (!cfToken || typeof cfToken !== "string" || cfToken.length > 2048 || !(await verifyTurnstile(cfToken))) {
      return NextResponse.json({ error: "Невалидна CAPTCHA. Опитайте отново." }, { status: 400 });
    }

    const pageRes = await fetch(`${MAGENTO_BASE}/contact`, { cache: "no-store" });
    if (!pageRes.ok) {
      console.error("contact: could not load Magento contact page, status", pageRes.status);
      return NextResponse.json({ error: "Изпращането не успя. Опитайте отново." }, { status: 502 });
    }

    const html = await pageRes.text();
    const formKey = html.match(/name="form_key"\s+value="([a-zA-Z0-9]+)"/)?.[1];
    if (!formKey) {
      console.error("contact: form_key not found in Magento page");
      return NextResponse.json({ error: "Изпращането не успя. Опитайте отново." }, { status: 502 });
    }

    const rawCookie = pageRes.headers.get("set-cookie");
    const cookieHeader = rawCookie ? extractCookieValues(rawCookie) : "";

    const formBody = new URLSearchParams({
      form_key: formKey,
      name: sanitize(name),
      email: sanitize(email),
      telephone: sanitize(telephone),
      comment: sanitize(comment),
      hideit: "",
    });

    const postHeaders: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    if (cookieHeader) postHeaders["Cookie"] = cookieHeader;

    const postRes = await fetch(`${MAGENTO_BASE}/contact/index/post`, {
      method: "POST",
      headers: postHeaders,
      body: formBody.toString(),
      redirect: "manual",
    });

    if (postRes.status >= 200 && postRes.status < 400) {
      return NextResponse.json({ success: true });
    }

    console.error("contact: Magento rejected submission, status", postRes.status);
    return NextResponse.json({ error: "Изпращането не успя. Опитайте отново." }, { status: 502 });
  } catch (error) {
    console.error("/api/contact error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Изпращането не успя. Опитайте отново." }, { status: 500 });
  }
}
