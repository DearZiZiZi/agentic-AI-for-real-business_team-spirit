import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Assistant } from "@/components/Assistant";

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HappyCake US | Fresh Cakes in Sugar Land, TX",
  description:
    "Real cakes, made by hand in our Sugar Land kitchen. Cake \"Honey\", cake \"Napoleon\", cake \"Pistachio Roll\" and more. Order on the site or send a message.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "HappyCake US",
              description:
                "Real cakes, made by hand in Sugar Land, TX. The original taste of happiness.",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Sugar Land",
                addressRegion: "TX",
                addressCountry: "US",
              },
              url: "https://happycake.us",
              priceRange: "$$",
              servesCuisine: "Bakery, Cakes, Desserts",
              slogan: "The original taste of happiness.",
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Assistant />
      </body>
    </html>
  );
}
