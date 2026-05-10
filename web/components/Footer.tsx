import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-hb-900 text-cream-50/80 py-10 mt-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h3 className="text-cream-50 font-display text-xl font-bold mb-3">
              HappyCake US
            </h3>
            <p className="text-sm font-body leading-relaxed text-cream-50/60">
              Real cakes, made by hand in our Sugar Land kitchen. The original
              taste of happiness.
            </p>
          </div>
          <div>
            <h4 className="text-cream-50 font-body font-semibold mb-4 text-sm tracking-wider uppercase">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm font-body">
              <li>
                <Link
                  href="/cakes"
                  className="hover:text-coral-light transition-colors"
                >
                  Our Cakes
                </Link>
              </li>
              <li>
                <Link
                  href="/custom"
                  className="hover:text-coral-light transition-colors"
                >
                  Custom Orders
                </Link>
              </li>
              <li>
                <Link
                  href="/policies"
                  className="hover:text-coral-light transition-colors"
                >
                  Policies
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-coral-light transition-colors"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-cream-50 font-body font-semibold mb-4 text-sm tracking-wider uppercase">
              Contact
            </h4>
            <ul className="space-y-2.5 text-sm font-body text-cream-50/60">
              <li>Sugar Land, TX</li>
              <li>Instagram: @happycake.us</li>
              <li>WhatsApp: Available during business hours</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-cream-50/10 mt-10 pt-5 text-center text-sm font-body text-cream-50/40">
          &copy; {new Date().getFullYear()} HappyCake US. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
