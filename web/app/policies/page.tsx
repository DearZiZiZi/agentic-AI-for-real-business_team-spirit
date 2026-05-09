export default function PoliciesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-chocolate text-center mb-10">
        Our Policies
      </h1>

      <div className="space-y-8">
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-chocolate mb-3">Ordering</h2>
          <ul className="space-y-2 text-chocolate/70 text-sm">
            <li>Standard orders require at least 48 hours advance notice</li>
            <li>Custom cakes require 5-7 business days notice</li>
            <li>
              Wedding cakes require a consultation and 2-week minimum lead time
            </li>
          </ul>
        </section>

        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-chocolate mb-3">Pickup</h2>
          <ul className="space-y-2 text-chocolate/70 text-sm">
            <li>Pickup from our Sugar Land, TX location</li>
            <li>Please bring your order confirmation</li>
            <li>Orders are held for 24 hours after the scheduled pickup time</li>
          </ul>
        </section>

        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-chocolate mb-3">Pricing</h2>
          <ul className="space-y-2 text-chocolate/70 text-sm">
            <li>All listed prices include tax</li>
            <li>Custom cake pricing is provided after consultation</li>
            <li>
              A deposit of 50% is required for custom orders over $100
            </li>
          </ul>
        </section>

        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-chocolate mb-3">
            Cancellations
          </h2>
          <ul className="space-y-2 text-chocolate/70 text-sm">
            <li>
              Standard orders: cancel up to 24 hours before pickup for a full
              refund
            </li>
            <li>
              Custom orders: deposit is non-refundable once production begins
            </li>
            <li>Contact us immediately if you need to make changes</li>
          </ul>
        </section>

        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-chocolate mb-3">
            Allergen Information
          </h2>
          <div className="bg-berry/5 border border-berry/20 rounded-lg p-4">
            <p className="text-chocolate/70 text-sm">
              Our kitchen handles: <strong>nuts, dairy, eggs, wheat, soy, and
              gluten</strong>. We cannot guarantee an allergen-free environment.
              Please inform us of any allergies when ordering.
            </p>
          </div>
        </section>

        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-chocolate mb-3">Contact</h2>
          <ul className="space-y-2 text-chocolate/70 text-sm">
            <li>Instagram: @happycakeus</li>
            <li>WhatsApp: Available during business hours</li>
            <li>On-site chat: Use the 💬 icon on our website</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
