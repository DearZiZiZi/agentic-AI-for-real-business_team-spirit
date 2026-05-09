export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-chocolate text-center mb-4">
        About Happy Cake
      </h1>
      <p className="text-center text-chocolate/60 mb-10 max-w-xl mx-auto">
        A family bakery in Sugar Land, TX, making every celebration sweeter.
      </p>

      <div className="bg-white rounded-xl shadow-md p-8 mb-8">
        <h2 className="text-2xl font-bold text-chocolate mb-4">Our Story</h2>
        <p className="text-chocolate/70 mb-4">
          Happy Cake started with a simple belief: every celebration deserves a
          cake made with love. Based in Sugar Land, TX, we serve the Greater
          Houston area with custom cakes, cupcakes, and desserts made fresh to
          order.
        </p>
        <p className="text-chocolate/70 mb-4">
          Every cake is made from scratch — never from a mix. We use quality
          ingredients and take pride in our craft, whether it&apos;s a simple
          birthday cake or an elaborate wedding centerpiece.
        </p>
        <p className="text-chocolate/70">
          We&apos;re a small team, and that means personal attention for every
          order. When you order from Happy Cake, you&apos;re not just getting a
          cake — you&apos;re getting our commitment to making your day special.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-sky/5 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">📍</div>
          <h3 className="font-bold text-chocolate mb-1">Location</h3>
          <p className="text-chocolate/60 text-sm">Sugar Land, TX</p>
          <p className="text-chocolate/60 text-sm">Greater Houston Area</p>
        </div>
        <div className="bg-sky/5 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">🎂</div>
          <h3 className="font-bold text-chocolate mb-1">What We Make</h3>
          <p className="text-chocolate/60 text-sm">Custom cakes, cupcakes,</p>
          <p className="text-chocolate/60 text-sm">and specialty desserts</p>
        </div>
      </div>

      <div className="bg-vanilla rounded-xl p-8 text-center">
        <h3 className="text-xl font-bold text-chocolate mb-2">
          Get in Touch
        </h3>
        <p className="text-chocolate/60 mb-4">
          Have questions? Chat with our AI assistant, message us on Instagram
          @happycakeus, or reach out on WhatsApp.
        </p>
        <p className="text-sm text-chocolate/40">
          We typically respond within a few minutes during business hours.
        </p>
      </div>
    </div>
  );
}
