export default function CustomPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
      <p className="text-center text-coral font-body text-sm font-semibold tracking-widest uppercase mb-2">
        Made for you
      </p>
      <h1 className="font-display text-4xl sm:text-5xl font-bold text-hb-700 text-center mb-4">
        Custom Orders
      </h1>
      <p className="text-center text-text/50 mb-8 sm:mb-12 max-w-xl mx-auto font-body text-base sm:text-lg px-2">
        Decoration is a small, optional service. Our main offering is the
        ready-made line — proven recipes, consistent quality. For celebrations
        that need something specific, we can help.
      </p>

      <div className="bg-white rounded-2xl p-6 sm:p-10 mb-8 sm:mb-10 border border-hb-200/40 shadow-sm">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-hb-700 mb-6 sm:mb-8">
          How it works
        </h2>
        <div className="space-y-6 sm:space-y-8 font-body">
          <div className="flex gap-4 sm:gap-5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-coral to-coral-light text-white rounded-xl flex items-center justify-center font-bold text-base sm:text-lg shrink-0 shadow-sm">
              1
            </div>
            <div>
              <h3 className="font-bold text-hb-700 text-base sm:text-lg">Tell us what you need</h3>
              <p className="text-text/50 mt-1 leading-relaxed text-sm sm:text-base">
                Use the chat assistant, WhatsApp, or Instagram DM. Describe the
                occasion, number of guests, preferred flavours, and any
                decoration ideas.
              </p>
            </div>
          </div>
          <div className="flex gap-4 sm:gap-5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-hb-400 to-hb-300 text-white rounded-xl flex items-center justify-center font-bold text-base sm:text-lg shrink-0 shadow-sm">
              2
            </div>
            <div>
              <h3 className="font-bold text-hb-700 text-base sm:text-lg">We confirm details</h3>
              <p className="text-text/50 mt-1 leading-relaxed text-sm sm:text-base">
                The owner reviews your request and gets back with pricing,
                availability, and any questions. We will be in touch within the
                hour.
              </p>
            </div>
          </div>
          <div className="flex gap-4 sm:gap-5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green to-green-light text-white rounded-xl flex items-center justify-center font-bold text-base sm:text-lg shrink-0 shadow-sm">
              3
            </div>
            <div>
              <h3 className="font-bold text-hb-700 text-base sm:text-lg">Confirm and pickup</h3>
              <p className="text-text/50 mt-1 leading-relaxed text-sm sm:text-base">
                Once confirmed, we secure your date. 50% deposit for orders over
                $100. Pick up from our Sugar Land location.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 sm:mb-10">
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-hb-200/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-coral/10 rounded-lg flex items-center justify-center mb-4">
            <span className="text-xl">&#x1F382;</span>
          </div>
          <h3 className="font-body font-bold text-hb-700 text-lg mb-2">
            Birthday cakes
          </h3>
          <p className="text-text/50 text-sm font-body leading-relaxed">
            Themed decoration on our proven base cakes. 5-7 days lead time.
          </p>
          <p className="text-coral font-bold font-body mt-3">From $55</p>
        </div>
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-hb-200/30 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-hb-400/10 rounded-lg flex items-center justify-center mb-4">
            <span className="text-xl">&#x1F4E6;</span>
          </div>
          <h3 className="font-body font-bold text-hb-700 text-lg mb-2">
            Office and events
          </h3>
          <p className="text-text/50 text-sm font-body leading-relaxed">
            Assorted dessert boxes and bulk orders for offices and gatherings.
          </p>
          <p className="text-coral font-bold font-body mt-3">From $120</p>
        </div>
      </div>

      <div className="text-center bg-gradient-to-br from-hb-50/50 to-cream-100 rounded-2xl p-8 sm:p-10 border border-hb-200/40">
        <h3 className="font-display text-xl sm:text-2xl font-bold text-hb-700 mb-3">
          Ready to start?
        </h3>
        <p className="text-text/50 font-body mb-3 text-base sm:text-lg">
          Order on the site at happycake.us or send a message on WhatsApp.
        </p>
        <p className="text-sm text-text/40 font-body">
          Our assistant will capture your requirements and connect you with the
          owner. — the HappyCake team
        </p>
      </div>
    </div>
  );
}
