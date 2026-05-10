import Link from "next/link";
import Image from "next/image";
import catalog from "@/data/catalog.json";

export default function Home() {
  const featured = catalog.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="bg-hb-900 text-cream-50 py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="font-display text-5xl font-bold text-cream-50 mb-4">
            The original taste of happiness.
          </h1>
          <p className="text-lg text-cream-200 mb-8 max-w-2xl mx-auto font-body">
            Real cakes, made by hand in our Sugar Land kitchen. Cake
            &quot;Honey&quot;, cake &quot;Napoleon&quot;, cake &quot;Pistachio
            Roll&quot; — same recipes, same taste your family remembers.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/cakes"
              className="bg-hb-700 text-cream-50 px-8 py-3 rounded text-lg font-body font-semibold hover:bg-hb-500 transition-colors"
            >
              Browse Our Cakes
            </Link>
            <Link
              href="/custom"
              className="bg-coral text-cream-50 px-8 py-3 rounded text-lg font-body font-semibold hover:bg-coral/90 transition-colors"
            >
              Custom Orders
            </Link>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="font-display text-3xl font-bold text-hb-900 text-center mb-10">
          The classics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featured.map((cake) => (
            <Link
              key={cake.id}
              href={`/cakes/${cake.slug}`}
              className="group bg-cream-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow border border-hb-900/10"
            >
              <div className="relative h-48 w-full bg-gradient-to-br from-sky/20 to-berry/10">
                <Image
                  src={cake.image}
                  alt={cake.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="p-5">
                <h3 className="font-display font-bold text-lg text-hb-900 group-hover:text-hb-500 transition-colors">
                  {cake.name}
                </h3>
                <p className="text-sm text-text/60 mt-1 font-body">
                  {cake.description}
                </p>
                <p className="text-hb-700 font-body font-semibold mt-3">
                  From ${(cake.variations[0].price_cents / 100).toFixed(2)}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/cakes"
            className="text-hb-500 font-body font-semibold hover:underline"
          >
            See the full menu
          </Link>
        </div>
      </section>

      {/* Why us */}
      <section className="bg-cream-100 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-hb-900 text-center mb-10">
            Why HappyCake?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center font-body">
            <div className="p-6">
              <h3 className="font-semibold text-lg mb-2 text-hb-900">
                Made by hand
              </h3>
              <p className="text-text/60 text-sm">
                Every cake from scratch. No mixes. No shortcuts. The taste your
                grandmother would recognise.
              </p>
            </div>
            <div className="p-6">
              <h3 className="font-semibold text-lg mb-2 text-hb-900">
                Real ingredients
              </h3>
              <p className="text-text/60 text-sm">
                Carefully selected. Fresh butter, real cream, local eggs.
                Quality you can taste in every layer.
              </p>
            </div>
            <div className="p-6">
              <h3 className="font-semibold text-lg mb-2 text-hb-900">
                Order anywhere
              </h3>
              <p className="text-text/60 text-sm">
                On the site, WhatsApp, Instagram DM, or chat with our assistant
                right here. Same cake, same care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-hb-900 mb-4">
            Ready to order?
          </h2>
          <p className="text-text/60 font-body mb-6">
            Order on the site at happycake.us or send a message on WhatsApp.
          </p>
          <Link
            href="/cakes"
            className="bg-hb-700 text-cream-50 px-8 py-3 rounded text-lg font-body font-semibold hover:bg-hb-500 transition-colors inline-block"
          >
            See the menu
          </Link>
        </div>
      </section>
    </div>
  );
}
