export default function PoliciesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-display text-4xl font-bold text-hb-900 text-center mb-10">
        Policies
      </h1>

      <div className="space-y-8">
        <section className="bg-cream-100 rounded-xl p-6 border border-hb-900/10">
          <h2 className="font-display text-xl font-bold text-hb-900 mb-3">
            Ordering
          </h2>
          <ul className="space-y-2 text-text/70 text-sm font-body list-disc pl-5">
            <li>Standard items: order 24 hours in advance so we can bake to you, not from stock</li>
            <li>Custom decoration: 5-7 business days notice</li>
            <li>Large orders and events: contact us to confirm capacity</li>
          </ul>
        </section>

        <section className="bg-cream-100 rounded-xl p-6 border border-hb-900/10">
          <h2 className="font-display text-xl font-bold text-hb-900 mb-3">
            Pickup
          </h2>
          <ul className="space-y-2 text-text/70 text-sm font-body list-disc pl-5">
            <li>Pickup from our Sugar Land, TX location</li>
            <li>Bring your order confirmation</li>
            <li>Orders are held for 24 hours after the scheduled pickup time</li>
          </ul>
        </section>

        <section className="bg-cream-100 rounded-xl p-6 border border-hb-900/10">
          <h2 className="font-display text-xl font-bold text-hb-900 mb-3">
            Pricing
          </h2>
          <ul className="space-y-2 text-text/70 text-sm font-body list-disc pl-5">
            <li>All listed prices include tax</li>
            <li>Custom decoration pricing provided after consultation</li>
            <li>50% deposit required for custom orders over $100</li>
          </ul>
        </section>

        <section className="bg-cream-100 rounded-xl p-6 border border-hb-900/10">
          <h2 className="font-display text-xl font-bold text-hb-900 mb-3">
            Cancellations
          </h2>
          <ul className="space-y-2 text-text/70 text-sm font-body list-disc pl-5">
            <li>Standard orders: cancel 24 hours before pickup for full refund</li>
            <li>Custom orders: deposit is non-refundable once production begins</li>
            <li>Contact us immediately if you need changes</li>
          </ul>
        </section>

        <section className="bg-coral/5 rounded-xl p-6 border border-coral/20">
          <h2 className="font-display text-xl font-bold text-hb-900 mb-3">
            Allergen information
          </h2>
          <p className="text-text/70 text-sm font-body">
            Our kitchen handles: <strong>nuts, dairy, eggs, wheat, soy, and
            gluten</strong>. We cannot guarantee an allergen-free environment.
            Please inform us of any allergies when ordering.
          </p>
        </section>

        <section className="bg-cream-100 rounded-xl p-6 border border-hb-900/10">
          <h2 className="font-display text-xl font-bold text-hb-900 mb-3">
            Contact
          </h2>
          <ul className="space-y-2 text-text/70 text-sm font-body list-disc pl-5">
            <li>Instagram: @happycake.us</li>
            <li>WhatsApp: available during business hours</li>
            <li>On-site chat: use the assistant on our website</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
