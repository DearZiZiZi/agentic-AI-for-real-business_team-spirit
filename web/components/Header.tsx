import Link from "next/link";

export function Header() {
  return (
    <header className="bg-hb-900 text-text-on-blue">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-xl font-bold tracking-wide">
            HappyCake
          </span>
          <span className="text-xs text-cream-200 font-body">
            Sugar Land, TX
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-body">
          <Link
            href="/cakes"
            className="text-cream-50 hover:text-cream-200 transition-colors"
          >
            Our Cakes
          </Link>
          <Link
            href="/custom"
            className="text-cream-50 hover:text-cream-200 transition-colors"
          >
            Custom Orders
          </Link>
          <Link
            href="/about"
            className="text-cream-50 hover:text-cream-200 transition-colors"
          >
            About
          </Link>
          <Link
            href="/policies"
            className="text-cream-50 hover:text-cream-200 transition-colors"
          >
            Policies
          </Link>
          <Link
            href="/cakes"
            className="bg-hb-700 text-cream-50 px-4 py-2 rounded hover:bg-hb-500 transition-colors"
          >
            Order Now
          </Link>
        </nav>
      </div>
    </header>
  );
}
