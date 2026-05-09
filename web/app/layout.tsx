import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Assistant } from "@/components/Assistant";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Happy Cake US | Custom Cakes in Sugar Land, TX",
  description:
    "Fresh custom cakes, cupcakes, and desserts made to order in Sugar Land, TX. Order online or chat with our AI assistant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: "Happy Cake US",
              description:
                "Custom cakes, cupcakes, and desserts in Sugar Land, TX",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Sugar Land",
                addressRegion: "TX",
                addressCountry: "US",
              },
              url: "https://happycake.us",
              telephone: "+1-000-000-0000",
              priceRange: "$$",
              servesCuisine: "Bakery",
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-vanilla text-chocolate">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Assistant />
      </body>
    </html>
  );
}
