import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch(
    "https://ee.econt.com/services/Nomenclatures/NomenclaturesService.getOffices.json",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showLC: false }),
      next: { revalidate: 36000 },
    }
  );

  if (!res.ok) {
    return NextResponse.json({ offices: [] }, { status: 502 });
  }

  const data = await res.json();
  const offices = (data.offices as EcontOffice[]).filter(
    (o) => o.address?.city?.country?.code2 === "BG"
  );

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
