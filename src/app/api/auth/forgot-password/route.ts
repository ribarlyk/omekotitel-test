import { NextRequest, NextResponse } from "next/server";
import { verifyTurnstile } from "@/src/app/utils/turnstile";

export async function POST(request: NextRequest) {
  try {
    const { email, cfToken } = await request.json();

    if (!cfToken || !(await verifyTurnstile(cfToken))) {
      return NextResponse.json({ error: "Невалидна CAPTCHA. Опитайте отново." }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Имейлът е задължителен" }, { status: 400 });
    }

    const baseUrl = (process.env.GRAPHQL_URL ?? "").replace("/graphql", "");
    if (!baseUrl) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    // Magento 2.3 REST API — initiates the forgot-password email flow
    const response = await fetch(`${baseUrl}/rest/V1/customers/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, template: "email_reset", websiteId: 1 }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Magento forgot-password error:", text);
      return NextResponse.json({ error: "Имейлът не е намерен или заявката не успя." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("/api/auth/forgot-password error:", error);
    return NextResponse.json({ error: "Заявката не успя" }, { status: 500 });
  }
}
