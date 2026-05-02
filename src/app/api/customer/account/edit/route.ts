import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Mutations } from "@/src/app/utils/graphql";
import { print } from "graphql";

const GQL = process.env.GRAPHQL_URL ?? "";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("auth-token")?.value ?? null;
}

async function gql(token: string, query: string, variables?: object) {
  const res = await fetch(GQL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

// PUT /api/customer/account/edit
// body: { firstname, lastname, email?, currentPassword?, newPassword? }
export async function PUT(req: NextRequest) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { firstname, lastname, email, currentPassword, newPassword } = await req.json();

  // 1. Update name (and optionally email)
  const customerInput: Record<string, string> = { firstname, lastname };
  if (email) {
    customerInput.email = email;
    customerInput.password = currentPassword; // required by Magento when changing email
  }

  const updateRes = await gql(token, print(Mutations.UPDATE_CUSTOMER), { input: customerInput });
  if (updateRes.errors) {
    return NextResponse.json({ error: updateRes.errors[0].message }, { status: 400 });
  }

  // 2. Change password if requested
  if (newPassword) {
    const pwRes = await gql(token, print(Mutations.CHANGE_CUSTOMER_PASSWORD), {
      currentPassword,
      newPassword,
    });
    if (pwRes.errors) {
      return NextResponse.json({ error: pwRes.errors[0].message }, { status: 400 });
    }
  }

  return NextResponse.json({ success: true });
}
