export default function CustomPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-chocolate text-center mb-4">
        Custom Cake Orders
      </h1>
      <p className="text-center text-chocolate/60 mb-10 max-w-xl mx-auto">
        Have something special in mind? We create custom cakes for weddings,
        birthdays, corporate events, and any celebration.
      </p>

      <div className="bg-white rounded-xl shadow-md p-8 mb-8">
        <h2 className="text-2xl font-bold text-chocolate mb-6">
          How Custom Orders Work
        </h2>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-sky text-white rounded-full flex items-center justify-center font-bold shrink-0">
              1
            </div>
            <div>
              <h3 className="font-bold text-chocolate">Tell Us Your Vision</h3>
              <p className="text-chocolate/60 text-sm mt-1">
                Chat with our AI assistant (click the 💬 icon) or send us a
                message on WhatsApp/Instagram. Describe your cake: size, flavor,
                design, occasion, and number of guests.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-sky text-white rounded-full flex items-center justify-center font-bold shrink-0">
              2
            </div>
            <div>
              <h3 className="font-bold text-chocolate">Consultation</h3>
              <p className="text-chocolate/60 text-sm mt-1">
                Our owner will review your request and get back to you with
                pricing, availability, and any questions. Custom cakes start with
                a personal consultation.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-sky text-white rounded-full flex items-center justify-center font-bold shrink-0">
              3
            </div>
            <div>
              <h3 className="font-bold text-chocolate">Confirm & Deposit</h3>
              <p className="text-chocolate/60 text-sm mt-1">
                Once you approve the design and price, we secure your date with a
                50% deposit for orders over $100. We begin production 3-5 days
                before your event.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-berry text-white rounded-full flex items-center justify-center font-bold shrink-0">
              4
            </div>
            <div>
              <h3 className="font-bold text-chocolate">Pickup Your Cake!</h3>
              <p className="text-chocolate/60 text-sm mt-1">
                Pick up your freshly made custom cake from our Sugar Land
                location on the scheduled date.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-vanilla rounded-xl p-6">
          <h3 className="font-bold text-chocolate mb-3">Wedding Cakes</h3>
          <p className="text-chocolate/60 text-sm mb-2">
            Multi-tier designs, fondant work, sugar flowers, and more. Minimum
            2-week lead time. Starts at $200.
          </p>
        </div>
        <div className="bg-vanilla rounded-xl p-6">
          <h3 className="font-bold text-chocolate mb-3">Birthday Cakes</h3>
          <p className="text-chocolate/60 text-sm mb-2">
            Themed cakes, character designs, photo cakes. 5-7 days lead time.
            Starts at $55.
          </p>
        </div>
        <div className="bg-vanilla rounded-xl p-6">
          <h3 className="font-bold text-chocolate mb-3">Corporate Events</h3>
          <p className="text-chocolate/60 text-sm mb-2">
            Branded cakes, large-format desserts, cupcake walls. Bulk pricing
            available.
          </p>
        </div>
        <div className="bg-vanilla rounded-xl p-6">
          <h3 className="font-bold text-chocolate mb-3">Special Occasions</h3>
          <p className="text-chocolate/60 text-sm mb-2">
            Baby showers, graduations, anniversaries — any reason to celebrate.
          </p>
        </div>
      </div>

      <div className="text-center bg-sky/5 rounded-xl p-8">
        <h3 className="text-xl font-bold text-chocolate mb-2">
          Ready to start?
        </h3>
        <p className="text-chocolate/60 mb-4">
          Click the chat icon below to describe your custom cake, or reach out
          on WhatsApp/Instagram.
        </p>
        <p className="text-sm text-chocolate/40">
          Our AI assistant will capture your requirements and connect you with
          the owner for a personal consultation.
        </p>
      </div>
    </div>
  );
}
