import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

const SECRET = process.env.REVALIDATE_SECRET;

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (!SECRET || secret !== SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  const { tag } = await request.json();

  if (!tag || typeof tag !== "string") {
    return NextResponse.json({ message: "Missing tag" }, { status: 400 });
  }

  revalidateTag(tag, "max");
  return NextResponse.json({ revalidated: true, tag });
}
