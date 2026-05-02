import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Mutations } from "@/src/app/utils/graphql";
import { print } from "graphql";

const GQL = process.env.GRAPHQL_URL ?? "";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("auth-token")?.value ?? null;
}

// PUT /api/customer/address/[id] — update
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const input = await req.json();

  const res = await fetch(GQL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      query: print(Mutations.UPDATE_CUSTOMER_ADDRESS),
      variables: { id: Number(id), input },
    }),
  });
  const data = await res.json();

  if (data.errors) return NextResponse.json({ error: data.errors[0].message }, { status: 400 });
  return NextResponse.json(data.data.updateCustomerAddress);
}
