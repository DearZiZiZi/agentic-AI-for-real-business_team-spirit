import Link from "next/link";
import Image from "next/image";
import catalog from "@/data/catalog.json";

export default function Home() {
  const featured = catalog.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-hb-500 via-hb-400 to-hb-300 text-cream-50 py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
          <p className="text-cream-50/80 font-body text-sm font-semibold tracking-widest uppercase mb-4">
            Handmade in Sugar Land, TX
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-cream-50 mb-6 leading-tight">
            The original taste<br className="hidden sm:block" /> of happiness.
          </h1>
          <p className="text-base sm:text-lg text-cream-50/80 mb-8 sm:mb-10 max-w-2xl mx-auto font-body leading-relaxed px-2">
            Real cakes, made by hand in our kitchen. Cake
            &quot;Honey&quot;, cake &quot;Napoleon&quot;, cake &quot;Pistachio
            Roll&quot; — same recipes, same taste your family remembers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <Link
              href="/cakes"
              className="bg-coral text-cream-50 px-8 py-3.5 rounded-lg text-lg font-body font-semibold hover:bg-coral-light hover:text-hb-900 transition-all shadow-md hover:shadow-lg"
            >
              Browse Our Cakes
            </Link>
            <Link
              href="/custom"
              className="bg-white/15 text-cream-50 px-8 py-3.5 rounded-lg text-lg font-body font-semibold hover:bg-white/25 transition-all border border-cream-50/30 backdrop-blur-sm"
            >
              Custom Orders
            </Link>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-6xl mx-auto px-4 py-14 sm:py-20">
        <p className="text-center text-coral font-body text-sm font-semibold tracking-widest uppercase mb-2">
          Most loved
        </p>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-hb-700 text-center mb-10 sm:mb-12">
          The classics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featured.map((cake) => (
            <Link
              key={cake.id}
              href={`/cakes/${cake.slug}`}
              className="group bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-hb-200/40 hover:-translate-y-1"
            >
              <div className="relative h-48 w-full bg-gradient-to-br from-hb-50 to-hb-100">
                <Image
                  src={cake.image}
                  alt={cake.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="p-5 sm:p-6">
                <h3 className="font-display font-bold text-lg sm:text-xl text-hb-700 group-hover:text-hb-500 transition-colors">
                  {cake.name}
                </h3>
                <p className="text-sm text-text/50 mt-2 font-body leading-relaxed">
                  {cake.description}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-coral font-body font-bold text-lg">
                    From ${(cake.variations[0].price_cents / 100).toFixed(2)}
                  </p>
                  <span className="text-hb-500 font-body text-sm font-semibold group-hover:underline">
                    View details &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-10 sm:mt-12">
          <Link
            href="/cakes"
            className="text-hb-500 font-body font-semibold hover:text-hb-700 transition-colors text-lg"
          >
            See the full menu &rarr;
          </Link>
        </div>
      </section>

      {/* Why us */}
      <section className="bg-gradient-to-b from-hb-50 to-cream-50 py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-green font-body text-sm font-semibold tracking-widest uppercase mb-2">
            Our promise
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-hb-700 text-center mb-10 sm:mb-14">
            Why HappyCake?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 font-body">
            <div className="bg-white rounded-2xl p-6 sm:p-8 text-center shadow-sm border border-hb-200/30 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-coral/10 rounded-xl flex items-center justify-center mx-auto mb-5">
                <span className="text-2xl">&#x1F932;</span>
              </div>
              <h3 className="font-bold text-lg mb-3 text-hb-700">
                Made by hand
              </h3>
              <p className="text-text/50 text-sm leading-relaxed">
                Every cake from scratch. No mixes. No shortcuts. The taste your
                grandmother would recognise.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 sm:p-8 text-center shadow-sm border border-hb-200/30 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-green/10 rounded-xl flex items-center justify-center mx-auto mb-5">
                <span className="text-2xl">&#x1F95A;</span>
              </div>
              <h3 className="font-bold text-lg mb-3 text-hb-700">
                Real ingredients
              </h3>
              <p className="text-text/50 text-sm leading-relaxed">
                Carefully selected. Fresh butter, real cream, local eggs.
                Quality you can taste in every layer.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 sm:p-8 text-center shadow-sm border border-hb-200/30 hover:shadow-md transition-shadow sm:col-span-2 md:col-span-1">
              <div className="w-14 h-14 bg-hb-400/10 rounded-xl flex items-center justify-center mx-auto mb-5">
                <span className="text-2xl">&#x1F4AC;</span>
              </div>
              <h3 className="font-bold text-lg mb-3 text-hb-700">
                Order anywhere
              </h3>
              <p className="text-text/50 text-sm leading-relaxed">
                On the site, WhatsApp, Instagram DM, or chat with our assistant
                right here. Same cake, same care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 sm:py-20 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-hb-700 mb-4">
            Ready to order?
          </h2>
          <p className="text-text/50 font-body mb-8 text-base sm:text-lg">
            Order on the site at happycake.us or send a message on WhatsApp.
          </p>
          <Link
            href="/cakes"
            className="bg-coral text-cream-50 px-8 sm:px-10 py-3.5 sm:py-4 rounded-lg text-lg font-body font-semibold hover:bg-coral-light hover:text-hb-900 transition-all inline-block shadow-md hover:shadow-lg"
          >
            See the menu
          </Link>
        </div>
      </section>
    </div>
  );
}
