import { NextResponse } from "next/server";
import { Queries } from "@/src/app/utils/graphql";
import { print } from "graphql";

export async function GET() {
  try {
    const query = print(Queries.GET_CATALOG);

    const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL ?? "";

    if (!GRAPHQL_ENDPOINT) {
      throw new Error("GRAPHQL_URL is not configured");
    }

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      return NextResponse.json(
        { error: "GraphQL query failed", details: data.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(data.data);
  } catch (error) {
    console.error("Catalog API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch catalog" },
      { status: 500 },
    );
  }
}
