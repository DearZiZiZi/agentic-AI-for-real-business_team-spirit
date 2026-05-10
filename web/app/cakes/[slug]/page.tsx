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
    <div className="max-w-4xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/cakes"
        className="text-hb-500 hover:underline text-sm font-body mb-6 inline-block"
      >
        ← Back to all cakes
      </Link>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="relative h-64 w-full bg-gradient-to-br from-sky/20 to-berry/10">
          <Image
            src={cake.image}
            alt={cake.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="p-8">
          <div className="flex justify-between items-start mb-4">
            <h1 className="font-display text-3xl font-bold text-hb-900">
              {cake.name}
            </h1>
            <span className="bg-hb-200/50 text-hb-700 px-3 py-1 rounded text-sm font-body uppercase tracking-wider">
              {cake.category}
            </span>
          </div>

          <p className="text-text/70 text-lg font-body mb-8">
            {cake.description}
          </p>

          <h2 className="font-display text-xl font-bold text-hb-900 mb-4">
            Sizes and pricing
          </h2>
          <div className="space-y-3 mb-8">
            {cake.variations.map((v, i) => (
              <div
                key={i}
                className="flex justify-between items-center p-4 bg-cream-50 rounded border border-hb-900/5"
              >
                <span className="font-body font-medium text-text">
                  {v.size}
                </span>
                <span className="text-xl font-body font-bold text-hb-700">
                  ${(v.price_cents / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-hb-200/20 rounded p-6 mb-6 border border-hb-200/40">
            <h3 className="font-body font-bold text-hb-900 mb-2">
              How to order
            </h3>
            <p className="text-text/70 text-sm font-body">
              Order on the site at happycake.us or send a message on WhatsApp.
              You can also use the chat assistant (bottom right) to place an
              order directly. Standard items: 24 hours advance notice.
            </p>
          </div>

          <div className="text-xs text-text/50 p-4 bg-cream-50 rounded font-body border border-hb-900/5">
            <strong>Allergen notice:</strong> Our cakes are made in a kitchen
            that handles nuts, dairy, eggs, wheat, and soy. We cannot guarantee
            an allergen-free environment.
          </div>
        </div>
      </div>
    </div>
  );
}
