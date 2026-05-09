import Link from "next/link";
import catalog from "@/data/catalog.json";

export default function CakesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-chocolate text-center mb-4">
        Our Cakes
      </h1>
      <p className="text-center text-chocolate/60 mb-10 max-w-xl mx-auto">
        All cakes are made fresh to order. Prices shown are starting prices —
        contact us for custom sizes and designs.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {catalog.map((cake) => (
          <Link
            key={cake.id}
            href={`/cakes/${cake.slug}`}
            className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="h-52 bg-gradient-to-br from-sky/20 to-berry/10 flex items-center justify-center text-7xl">
              {cake.category === "cupcakes" ? "🧁" : "🎂"}
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start">
                <h2 className="font-bold text-lg text-chocolate group-hover:text-sky transition-colors">
                  {cake.name}
                </h2>
                <span className="text-xs bg-sky/10 text-sky px-2 py-1 rounded-full capitalize">
                  {cake.category}
                </span>
              </div>
              <p className="text-sm text-chocolate/60 mt-2">
                {cake.description}
              </p>
              <div className="mt-4 space-y-1">
                {cake.variations.map((v, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-sm text-chocolate/80"
                  >
                    <span>{v.size}</span>
                    <span className="font-semibold text-sky">
                      ${(v.price_cents / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <span className="text-sky font-semibold text-sm group-hover:underline">
                  View Details →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="text-center mt-12 p-8 bg-berry/5 rounded-xl">
        <h3 className="text-xl font-bold text-chocolate mb-2">
          Need something custom?
        </h3>
        <p className="text-chocolate/60 mb-4">
          We create custom cakes for weddings, birthdays, and special events.
        </p>
        <Link
          href="/custom"
          className="bg-berry text-white px-6 py-2 rounded-lg font-semibold hover:bg-berry/90 transition-colors inline-block"
        >
          Request a Custom Cake
        </Link>
      </div>
    </div>
  );
}
