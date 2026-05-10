import Link from "next/link";
import Image from "next/image";
import catalog from "@/data/catalog.json";

export default function CakesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-14">
      <p className="text-center text-coral font-body text-sm font-semibold tracking-widest uppercase mb-2">
        Fresh daily
      </p>
      <h1 className="font-display text-5xl font-bold text-hb-900 text-center mb-4">
        Our Cakes
      </h1>
      <p className="text-center text-text/50 mb-12 max-w-xl mx-auto font-body text-lg">
        All cakes are made fresh. Prices shown are current — for custom sizes
        and decoration, send us a message.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {catalog.map((cake) => (
          <Link
            key={cake.id}
            href={`/cakes/${cake.slug}`}
            className="group bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-hb-200/40 hover:-translate-y-1"
          >
            <div className="relative h-52 w-full bg-gradient-to-br from-hb-100 to-cream-100">
              <Image
                src={cake.image}
                alt={cake.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <span className="absolute top-3 right-3 text-[10px] bg-hb-900/80 text-cream-50 px-2.5 py-1 rounded-full font-body uppercase tracking-wider backdrop-blur-sm z-10">
                {cake.category}
              </span>
            </div>
            <div className="p-6">
              <h2 className="font-display font-bold text-xl text-hb-900 group-hover:text-hb-500 transition-colors">
                {cake.name}
              </h2>
              <p className="text-sm text-text/50 mt-2 font-body leading-relaxed">
                {cake.description}
              </p>
              <div className="mt-4 space-y-1.5">
                {cake.variations.map((v, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-sm text-text/70 font-body"
                  >
                    <span>{v.size}</span>
                    <span className="font-bold text-coral">
                      ${(v.price_cents / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-hb-200/30">
                <span className="text-hb-500 font-body font-semibold text-sm group-hover:underline">
                  View details &rarr;
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="text-center mt-16 p-10 bg-gradient-to-br from-hb-100/50 to-cream-100 rounded-2xl border border-hb-200/40">
        <h3 className="font-display text-2xl font-bold text-hb-900 mb-3">
          Something special in mind?
        </h3>
        <p className="text-text/50 font-body mb-6 max-w-md mx-auto">
          Custom decoration is available for celebrations. Send us a message and
          we will work out the details.
        </p>
        <Link
          href="/custom"
          className="bg-coral text-cream-50 px-8 py-3 rounded-lg font-body font-semibold hover:bg-coral-light hover:text-hb-900 transition-all inline-block shadow-sm"
        >
          Request a custom cake
        </Link>
      </div>
    </div>
  );
}
