import { NextResponse } from "next/server";

type MappedOffice = { id: number; name: string; address: { city: { name: string; postCode: string }; fullAddress: string } };
let memCache: { offices: MappedOffice[]; expiresAt: number } | null = null;

export async function GET() {
  if (memCache && Date.now() < memCache.expiresAt) {
    return NextResponse.json({ offices: memCache.offices });
  }

  try {
    const res = await fetch("https://api.speedy.bg/v1/location/office", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userName: Number(process.env.SPEEDY_USERNAME),
        password: Number(process.env.SPEEDY_PASSWORD),
        language: "BG",
      }),
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok || !Array.isArray(data.offices)) {
      console.error("Speedy API error:", JSON.stringify(data));
      return NextResponse.json({ offices: [] }, { status: 502 });
    }

    const offices: MappedOffice[] = (data.offices as SpeedyOffice[]).map((o) => ({
      id: o.id,
      name: o.name,
      address: {
        city: { name: o.address.siteName, postCode: o.address.postCode ?? "" },
        fullAddress: o.address.fullAddressString ?? o.address.localAddressString ?? o.address.siteName,
      },
    }));

    memCache = { offices, expiresAt: Date.now() + 10 * 60 * 60 * 1000 };

    return NextResponse.json({ offices }, {
      headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400" },
    });
  } catch (e) {
    console.error("Speedy fetch error:", e);
    return NextResponse.json({ offices: [] }, { status: 500 });
  }
}

interface SpeedyOffice {
  id: number;
  name: string;
  address: {
    siteName: string;
    postCode?: string;
    fullAddressString?: string;
    localAddressString?: string;
  };
}
