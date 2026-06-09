import { NextResponse } from "next/server";

let memCache: { offices: EcontOffice[]; expiresAt: number } | null = null;

export async function GET() {
  if (memCache && Date.now() < memCache.expiresAt) {
    return NextResponse.json({ offices: memCache.offices });
  }

  const res = await fetch(
    "https://ee.econt.com/services/Nomenclatures/NomenclaturesService.getOffices.json",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showLC: false }),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return NextResponse.json({ offices: [] }, { status: 502 });
  }

  const data = await res.json();
  const offices = (data.offices as EcontOffice[]).filter(
    (o) => o.address?.city?.country?.code2 === "BG"
  );

  memCache = { offices, expiresAt: Date.now() + 10 * 60 * 60 * 1000 };

  return NextResponse.json({ offices });
}

interface EcontOffice {
  id: number;
  name: string;
  address: {
    city: {
      name: string;
      country: { code2: string };
    };
    fullAddress: string;
  };
}
