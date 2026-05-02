import { NextRequest, NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profil/:path*",
    "/customer/account",
    "/customer/account/:path*",
    "/customer/address",
    "/customer/address/:path*",
    "/sales/order/history",
    "/sales/order/history/:path*",
    "/sales/order/view/:path*",
  ],
};
