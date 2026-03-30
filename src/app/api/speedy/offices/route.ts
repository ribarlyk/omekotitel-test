import { NextResponse } from "next/server";

export async function GET() {
  try {
    // no next.revalidate — response is >2MB and can't be cached at fetch level
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

    const offices = (data.offices as SpeedyOffice[]).map((o) => ({
      id: o.id,
      name: o.name,
      address: {
        city: { name: o.address.siteName, postCode: o.address.postCode ?? "" },
        fullAddress: o.address.fullAddressString ?? o.address.localAddressString ?? o.address.siteName,
      },
    }));

    return NextResponse.json({ offices });
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
