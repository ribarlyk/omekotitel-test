import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, resetToken, newPassword } = await request.json();

    if (!email || !resetToken || !newPassword) {
      return NextResponse.json({ error: "Всички полета са задължителни" }, { status: 400 });
    }

    const baseUrl = (process.env.GRAPHQL_URL ?? "").replace("/graphql", "");
    if (!baseUrl) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const response = await fetch(`${baseUrl}/rest/V1/customers/resetPassword`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, resetToken, newPassword }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Magento reset-password error:", text);
      return NextResponse.json({ error: "Невалиден или изтекъл линк за нулиране." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("/api/auth/reset-password error:", error);
    return NextResponse.json({ error: "Заявката не успя" }, { status: 500 });
  }
}
