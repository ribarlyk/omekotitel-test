import { NextRequest, NextResponse } from "next/server";
import { Mutations } from "@/src/app/utils/graphql";
import { print } from "graphql";
import { verifyTurnstile } from "@/src/app/utils/turnstile";

export async function POST(request: NextRequest) {
  try {
    const { email, password, repass, firstname, lastname, is_subscribed, cfToken } =
      await request.json();

    if (!cfToken || !(await verifyTurnstile(cfToken))) {
      return NextResponse.json({ error: "Невалидна CAPTCHA. Опитайте отново." }, { status: 400 });
    }

    if (!email || !password || !firstname || !lastname) {
      return NextResponse.json(
        { error: "Email, password, first name, and last name are required" },
        { status: 400 }
      );
    }

    if (password !== repass) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL ?? "";

    if (!GRAPHQL_ENDPOINT) {
      console.error("GRAPHQL_URL is not configured");
      return NextResponse.json(
        { error: "Server not configured" },
        { status: 500 }
      );
    }

    const mutation = print(Mutations.CREATE_CUSTOMER);

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            email,
            firstname,
            lastname,
            password,
            is_subscribed: is_subscribed ?? false,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GraphQL HTTP error during registration", response.status, errorText);
      return NextResponse.json(
        { error: "Registration failed" },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (data.errors) {
      console.error("GraphQL registration errors:", data.errors);
      const errorMessage = data.errors[0]?.message || "Registration failed";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    if (!data?.data?.createCustomer?.customer) {
      return NextResponse.json(
        { error: "Registration failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      customer: data.data.createCustomer.customer,
    });
  } catch (error) {
    console.error("/api/register error:", error);
    return NextResponse.json(
      { error: "Failed to register" },
      { status: 500 }
    );
  }
}
