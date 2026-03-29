import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { ApolloWrapper } from "./ApolloWrapper";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { DesktopDeliveryBanner } from "./components/DeliveryBanner/DesktopDeliveryBanner";
import { MobileHeader } from "./components/MobileHeader";
import type { NavCatalogCategory } from "./constants";
import { fetchCatalog } from "./utils/graphql/fetchers";
import { Toaster } from "sonner";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Онлайн магазин за омекотители и аксесоари | omekotitel.bg",
  description: "Онлайн магазин за омекотители и аксесоари",
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const catalog = await fetchCatalog();
  const categoryList = (catalog?.categoryList ?? []) as NavCatalogCategory[];

  return (
    <html lang="bg">
      <body
        className={`${roboto.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ApolloWrapper>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <Toaster position="top-center" richColors />
                {/* Mobile sticky header */}
                <div className="lg:hidden sticky top-0 z-30 shadow-md">
                  <MobileHeader categoryList={categoryList} />
                </div>
                {/* Desktop: delivery banner sticky on its own */}
                <DesktopDeliveryBanner />
                {/* Desktop sticky header + nav */}
                <div className="hidden lg:sticky lg:top-0 lg:z-30 lg:shadow-md lg:block">
                  <Header />
                  <Navigation categoryList={categoryList} />
                </div>
                {children}
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}
