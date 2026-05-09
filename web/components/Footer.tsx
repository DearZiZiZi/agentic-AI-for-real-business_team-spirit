import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-chocolate text-white/80 py-8 mt-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-3">
              🎂 Happy Cake US
            </h3>
            <p className="text-sm">
              Fresh custom cakes, cupcakes, and desserts made to order in Sugar
              Land, TX.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/cakes" className="hover:text-sky transition-colors">
                  Our Cakes
                </Link>
              </li>
              <li>
                <Link
                  href="/custom"
                  className="hover:text-sky transition-colors"
                >
                  Custom Orders
                </Link>
              </li>
              <li>
                <Link
                  href="/policies"
                  className="hover:text-sky transition-colors"
                >
                  Policies
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-sky transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>Sugar Land, TX</li>
              <li>Instagram: @happycakeus</li>
              <li>WhatsApp: Available during business hours</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/20 mt-8 pt-4 text-center text-sm">
          &copy; {new Date().getFullYear()} Happy Cake US. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
