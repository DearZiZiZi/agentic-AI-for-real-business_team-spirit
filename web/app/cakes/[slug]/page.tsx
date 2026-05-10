import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import catalog from "@/data/catalog.json";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return catalog.map((cake) => ({ slug: cake.slug }));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const cake = catalog.find((c) => c.slug === slug);

  if (!cake) return notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["Product", "MenuItem"],
    name: cake.name,
    description: cake.description,
    category: cake.category,
    offers: cake.variations.map((v) => ({
      "@type": "Offer",
      name: v.size,
      price: (v.price_cents / 100).toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    })),
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/cakes"
        className="text-hb-500 hover:underline text-sm font-body mb-6 inline-block"
      >
        &larr; Back to all cakes
      </Link>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-hb-200/40">
        <div className="relative h-48 sm:h-64 w-full bg-gradient-to-br from-hb-50 to-hb-100">
          <Image
            src={cake.image}
            alt={cake.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-hb-700">
              {cake.name}
            </h1>
            <span className="bg-hb-100 text-hb-500 px-3 py-1 rounded-full text-sm font-body uppercase tracking-wider self-start">
              {cake.category}
            </span>
          </div>

          <p className="text-text/70 text-base sm:text-lg font-body mb-8">
            {cake.description}
          </p>

          <h2 className="font-display text-xl font-bold text-hb-700 mb-4">
            Sizes and pricing
          </h2>
          <div className="space-y-3 mb-8">
            {cake.variations.map((v, i) => (
              <div
                key={i}
                className="flex justify-between items-center p-4 bg-hb-50 rounded-xl border border-hb-200/30"
              >
                <span className="font-body font-medium text-text">
                  {v.size}
                </span>
                <span className="text-xl font-body font-bold text-hb-500">
                  ${(v.price_cents / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-hb-50 rounded-xl p-5 sm:p-6 mb-6 border border-hb-200/30">
            <h3 className="font-body font-bold text-hb-700 mb-2">
              How to order
            </h3>
            <p className="text-text/70 text-sm font-body leading-relaxed">
              Order on the site at happycake.us or send a message on WhatsApp.
              You can also use the chat assistant (bottom right) to place an
              order directly. Standard items: 24 hours advance notice.
            </p>
          </div>

          <div className="text-xs text-text/50 p-4 bg-cream-50 rounded-xl font-body border border-hb-200/20">
            <strong>Allergen notice:</strong> Our cakes are made in a kitchen
            that handles nuts, dairy, eggs, wheat, and soy. We cannot guarantee
            an allergen-free environment.
          </div>
        </div>
      </div>
    </div>
  );
}
