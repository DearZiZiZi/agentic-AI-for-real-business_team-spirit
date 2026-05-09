import Link from "next/link";
import catalog from "@/data/catalog.json";

export default function Home() {
  const featured = catalog.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-sky/10 to-vanilla py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-chocolate mb-4">
            Fresh Cakes, Made with Love
          </h1>
          <p className="text-xl text-chocolate/70 mb-8 max-w-2xl mx-auto">
            Custom cakes, cupcakes, and desserts made to order in Sugar Land,
            TX. From birthdays to weddings, we make every celebration sweeter.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/cakes"
              className="bg-sky text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-sky/90 transition-colors"
            >
              Browse Our Cakes
            </Link>
            <Link
              href="/custom"
              className="bg-berry text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-berry/90 transition-colors"
            >
              Custom Orders
            </Link>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-chocolate text-center mb-10">
          Popular Picks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featured.map((cake) => (
            <Link
              key={cake.id}
              href={`/cakes/${cake.slug}`}
              className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="h-48 bg-gradient-to-br from-sky/20 to-berry/10 flex items-center justify-center text-6xl">
                🎂
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg text-chocolate group-hover:text-sky transition-colors">
                  {cake.name}
                </h3>
                <p className="text-sm text-chocolate/60 mt-1">
                  {cake.description}
                </p>
                <p className="text-sky font-semibold mt-3">
                  From ${(cake.variations[0].price_cents / 100).toFixed(2)}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/cakes"
            className="text-sky font-semibold hover:underline"
          >
            View All Cakes →
          </Link>
        </div>
      </section>

      {/* Why us */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-chocolate text-center mb-10">
            Why Happy Cake?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="font-bold text-lg mb-2">Custom Designs</h3>
              <p className="text-chocolate/60 text-sm">
                From simple elegance to elaborate themes — we bring your vision
                to life.
              </p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-4">🌿</div>
              <h3 className="font-bold text-lg mb-2">Fresh Ingredients</h3>
              <p className="text-chocolate/60 text-sm">
                Every cake made from scratch with quality ingredients, never
                from a mix.
              </p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="font-bold text-lg mb-2">Easy Ordering</h3>
              <p className="text-chocolate/60 text-sm">
                Order online, via WhatsApp, Instagram DM, or chat with our AI
                assistant right here.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-sky/5 py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-chocolate mb-4">
            Ready to Order?
          </h2>
          <p className="text-chocolate/60 mb-6">
            Click the chat icon in the bottom right to talk to our AI assistant,
            or browse our catalog to find the perfect cake.
          </p>
          <Link
            href="/cakes"
            className="bg-berry text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-berry/90 transition-colors inline-block"
          >
            Start Shopping
          </Link>
        </div>
      </section>
    </div>
  );
}
