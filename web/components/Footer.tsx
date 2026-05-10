import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-hb-900 text-cream-50/80 py-8 mt-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-cream-50 font-display text-lg font-bold mb-3">
              HappyCake US
            </h3>
            <p className="text-sm font-body">
              Real cakes, made by hand in our Sugar Land kitchen. The original
              taste of happiness.
            </p>
          </div>
          <div>
            <h4 className="text-cream-50 font-body font-semibold mb-3">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm font-body">
              <li>
                <Link
                  href="/cakes"
                  className="hover:text-cream-200 transition-colors"
                >
                  Our Cakes
                </Link>
              </li>
              <li>
                <Link
                  href="/custom"
                  className="hover:text-cream-200 transition-colors"
                >
                  Custom Orders
                </Link>
              </li>
              <li>
                <Link
                  href="/policies"
                  className="hover:text-cream-200 transition-colors"
                >
                  Policies
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-cream-200 transition-colors"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-cream-50 font-body font-semibold mb-3">
              Contact
            </h4>
            <ul className="space-y-2 text-sm font-body">
              <li>Sugar Land, TX</li>
              <li>Instagram: @happycake.us</li>
              <li>WhatsApp: available during business hours</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-cream-50/20 mt-8 pt-4 text-center text-sm font-body">
          &copy; {new Date().getFullYear()} HappyCake US. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
