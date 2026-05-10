export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-display text-4xl font-bold text-hb-900 text-center mb-4">
        About HappyCake
      </h1>
      <p className="text-center text-text/60 mb-10 max-w-xl mx-auto font-body">
        A neighbourhood bakery in Sugar Land, TX.
      </p>

      <div className="bg-cream-100 rounded-xl p-8 mb-8 border border-hb-900/10">
        <h2 className="font-display text-2xl font-bold text-hb-900 mb-4">
          It started with a phrase
        </h2>
        <p className="text-text/70 font-body mb-4">
          &quot;It&apos;s just like homemade.&quot;
        </p>
        <p className="text-text/70 font-body mb-4">
          We started baking cakes. As if for ourselves. Delicious, sweet, fresh
          cakes. People kept coming back saying it tasted like they baked it
          themselves. And we realised that homemade taste was the centre of what
          we wanted to make.
        </p>
        <p className="text-text/70 font-body mb-4">
          Every ingredient is carefully selected. Every cake is hand-decorated
          and hand-packed. Every recipe was perfected over years until it earned
          its name.
        </p>
        <p className="text-text/70 font-body">
          We love watching people be happy. We love making delicious things. The
          combination is HappyCake.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-hb-200/20 rounded-xl p-6 text-center border border-hb-200/40">
          <h3 className="font-body font-bold text-hb-900 mb-1">Location</h3>
          <p className="text-text/60 text-sm font-body">Sugar Land, TX</p>
          <p className="text-text/60 text-sm font-body">
            Greater Houston Area
          </p>
        </div>
        <div className="bg-hb-200/20 rounded-xl p-6 text-center border border-hb-200/40">
          <h3 className="font-body font-bold text-hb-900 mb-1">What we make</h3>
          <p className="text-text/60 text-sm font-body">
            Traditional cakes, desserts, and coffee
          </p>
          <p className="text-text/60 text-sm font-body">
            The kind handed down through families
          </p>
        </div>
      </div>

      <div className="bg-cream-50 rounded-xl p-8 text-center border border-hb-900/5">
        <h3 className="font-display text-xl font-bold text-hb-900 mb-2">
          Get in touch
        </h3>
        <p className="text-text/60 font-body">
          Order on the site at happycake.us or send a message on WhatsApp.
        </p>
      </div>
    </div>
  );
}
