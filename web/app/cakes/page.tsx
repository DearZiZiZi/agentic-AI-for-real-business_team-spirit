import Link from "next/link";
import catalog from "@/data/catalog.json";

export default function CakesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="font-display text-4xl font-bold text-hb-900 text-center mb-4">
        Our Cakes
      </h1>
      <p className="text-center text-text/60 mb-10 max-w-xl mx-auto font-body">
        All cakes are made fresh. Prices shown are current — for custom sizes
        and decoration, send us a message.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {catalog.map((cake) => (
          <Link
            key={cake.id}
            href={`/cakes/${cake.slug}`}
            className="group bg-cream-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow border border-hb-900/10"
          >
            <div className="h-52 bg-hb-200/30 flex items-center justify-center">
              <span className="text-7xl opacity-70">
                {cake.category === "custom"
                  ? "🎨"
                  : cake.category === "catering"
                    ? "📦"
                    : "🎂"}
              </span>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start">
                <h2 className="font-display font-bold text-lg text-hb-900 group-hover:text-hb-500 transition-colors">
                  {cake.name}
                </h2>
                <span className="text-xs bg-hb-200/50 text-hb-700 px-2 py-1 rounded font-body uppercase tracking-wider">
                  {cake.category}
                </span>
              </div>
              <p className="text-sm text-text/60 mt-2 font-body">
                {cake.description}
              </p>
              <div className="mt-4 space-y-1">
                {cake.variations.map((v, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-sm text-text/80 font-body"
                  >
                    <span>{v.size}</span>
                    <span className="font-semibold text-hb-700">
                      ${(v.price_cents / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <span className="text-hb-500 font-body font-semibold text-sm group-hover:underline">
                  View details
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="text-center mt-12 p-8 bg-cream-100 rounded-xl border border-hb-900/10">
        <h3 className="font-display text-xl font-bold text-hb-900 mb-2">
          Something special in mind?
        </h3>
        <p className="text-text/60 font-body mb-4">
          Custom decoration is available for celebrations. Send us a message and
          we will work out the details.
        </p>
        <Link
          href="/custom"
          className="bg-coral text-cream-50 px-6 py-2 rounded font-body font-semibold hover:bg-coral/90 transition-colors inline-block"
        >
          Request a custom cake
        </Link>
      </div>
    </div>
  );
}
