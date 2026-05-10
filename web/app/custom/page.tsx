export default function CustomPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-display text-4xl font-bold text-hb-900 text-center mb-4">
        Custom Orders
      </h1>
      <p className="text-center text-text/60 mb-10 max-w-xl mx-auto font-body">
        Decoration is a small, optional service. Our main offering is the
        ready-made line — proven recipes, consistent quality. For celebrations
        that need something specific, we can help.
      </p>

      <div className="bg-cream-100 rounded-xl p-8 mb-8 border border-hb-900/10">
        <h2 className="font-display text-2xl font-bold text-hb-900 mb-6">
          How it works
        </h2>
        <div className="space-y-6 font-body">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-hb-700 text-cream-50 rounded-full flex items-center justify-center font-bold shrink-0">
              1
            </div>
            <div>
              <h3 className="font-bold text-hb-900">Tell us what you need</h3>
              <p className="text-text/60 text-sm mt-1">
                Use the chat assistant, WhatsApp, or Instagram DM. Describe the
                occasion, number of guests, preferred flavours, and any
                decoration ideas.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-hb-700 text-cream-50 rounded-full flex items-center justify-center font-bold shrink-0">
              2
            </div>
            <div>
              <h3 className="font-bold text-hb-900">We confirm details</h3>
              <p className="text-text/60 text-sm mt-1">
                The owner reviews your request and gets back with pricing,
                availability, and any questions. We will be in touch within the
                hour.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-hb-700 text-cream-50 rounded-full flex items-center justify-center font-bold shrink-0">
              3
            </div>
            <div>
              <h3 className="font-bold text-hb-900">Confirm and pickup</h3>
              <p className="text-text/60 text-sm mt-1">
                Once confirmed, we secure your date. 50% deposit for orders over
                $100. Pick up from our Sugar Land location.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-cream-50 rounded-xl p-6 border border-hb-900/5">
          <h3 className="font-body font-bold text-hb-900 mb-3">
            Birthday cakes
          </h3>
          <p className="text-text/60 text-sm font-body">
            Themed decoration on our proven base cakes. 5-7 days lead time.
            From $55.
          </p>
        </div>
        <div className="bg-cream-50 rounded-xl p-6 border border-hb-900/5">
          <h3 className="font-body font-bold text-hb-900 mb-3">
            Office and events
          </h3>
          <p className="text-text/60 text-sm font-body">
            Assorted dessert boxes and bulk orders for offices and gatherings.
            From $120.
          </p>
        </div>
      </div>

      <div className="text-center bg-hb-200/20 rounded-xl p-8 border border-hb-200/40">
        <h3 className="font-display text-xl font-bold text-hb-900 mb-2">
          Ready to start?
        </h3>
        <p className="text-text/60 font-body mb-2">
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
