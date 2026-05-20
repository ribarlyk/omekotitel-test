import type { MetadataRoute } from "next";

// Magento layered-navigation parameters seen in production HTML.
// Blocking these avoids duplicate content + saves crawl budget on
// filter permutations that explode combinatorially.
const FACETED_PARAMS = [
  "color",
  "size",
  "price",
  "brand",
  "marki",
  "aromat",
  "aromati",
  "aromat_dush_gel_2",
  "aromat_sapuni",
  "prilozhenie",
  "proizhod",
  "tretirane_na_petna_ot",
  "dejstvie",
  "dejstvie_dush_gel",
  "vid_materii",
  "podhodjascho_za",
  "podhodjascho_za_hrani",
  "razfasovka",
  "razmer",
  "cvjat",
  "svojstva",
  "material_na_izrabotka",
  "tip_zatvarjane",
  "tip_kosa",
  "tip_kuhnenska_prinadlejnost",
  "tip_podove_pov_rhnosti",
  "tip_vero",
  "mozhe_da_se_izpolzva_v",
  "kosa",
  "obem_kapacitet",
  "broj_izmivanija",
  "broj_cikli_upotreba",
  "broj_cikli_sushene",
  "d_lgotrajnost",
  "temperaturna_ustojchivost",
  // Magento pagination / sorting
  "p",
  "product_list_order",
  "product_list_dir",
  "product_list_limit",
  "product_list_mode",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/customer/",
        "/profil/",
        "/sales/",
        "/onestepcheckout/",
        "/api/",
        "/forgot-password/",
        "/search",
        // Faceted navigation: disallow every URL carrying one of these query params.
        ...FACETED_PARAMS.map((p) => `/*?*${p}=`),
        ...FACETED_PARAMS.map((p) => `/*&${p}=`),
      ],
    },
    sitemap: "https://omekotitel.bg/sitemap.xml",
  };
}
