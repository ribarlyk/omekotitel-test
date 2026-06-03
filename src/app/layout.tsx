import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { DesktopDeliveryBanner } from "./components/DeliveryBanner/DesktopDeliveryBanner";
import { MobileHeader } from "./components/MobileHeader";
import type { NavCatalogCategory } from "./constants";
import { fetchCatalog } from "./utils/graphql/fetchers";
import { Toaster } from "sonner";
import { ChatButton } from "./components/ChatButton";
import { ScrollToTop } from "./components/ScrollToTop";
import { Footer } from "./components/Footer";
import TrustBar from "./components/TrustBar";
import { Breadcrumb } from "./components/Breadcrumb";
import { BreadcrumbProvider } from "./contexts/BreadcrumbContext";
import { JsonLd } from "./components/JsonLd";
import { buildOrganizationSchema, buildWebSiteSchema } from "./utils/seo";
import { CookieConsentProvider } from "./contexts/CookieConsentContext";
import { AnalyticsScripts } from "./components/AnalyticsScripts";
import { CookieBanner } from "./components/CookieBanner";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Онлайн магазин за омекотители и аксесоари | omekotitel.bg",
    template: "%s | omekotitel.bg",
  },
  description:
    "Открийте широк асортимент от омекотители, перилни препарати и домашни аксесоари. Бърза доставка до офис на Еконт или Спиди в цяла България.",
  metadataBase: new URL("https://omekotitel.bg"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "bg_BG",
    siteName: "Omekotitel.bg",
    images: [{ url: "/assets/omekotitel-bg_1.avif", width: 1200, height: 630, alt: "Omekotitel.bg" }],
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const catalog = await fetchCatalog();
  const categoryList = catalog.categoryList as NavCatalogCategory[];

  return (
    <html lang="bg">
      <head>
        <JsonLd data={[buildOrganizationSchema(), buildWebSiteSchema()]} />
      </head>
      <body
        className={`${roboto.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <CookieConsentProvider>
          <AuthProvider>
            <CartProvider>
              <BreadcrumbProvider>
                  <ScrollToTop />
                  <Toaster position="top-center" richColors />
                  {/* Mobile sticky header */}
                  <div className="lg:hidden sticky top-0 z-30 shadow-md print:hidden">
                    <MobileHeader categoryList={categoryList} />
                  </div>
                  {/* Desktop: delivery banner sticky on its own */}
                  <div className="print:hidden"><DesktopDeliveryBanner /></div>
                  {/* Desktop sticky header + nav */}
                  <div className="hidden lg:sticky lg:top-0 lg:z-30 lg:shadow-md lg:block print:hidden">
                    <Header />
                    <Navigation categoryList={categoryList} />
                  </div>
                  <Breadcrumb categoryList={categoryList} />
                  <main className="min-h-[70vh]">{children}</main>
                  <div className="print:hidden"><TrustBar /></div>
                  <div className="print:hidden"><Footer /></div>
                  <ChatButton />
              </BreadcrumbProvider>
            </CartProvider>
          </AuthProvider>
          <AnalyticsScripts />
          <CookieBanner />
        </CookieConsentProvider>
      </body>
    </html>
  );
}
