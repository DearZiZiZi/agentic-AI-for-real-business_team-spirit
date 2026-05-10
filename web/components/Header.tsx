import Link from "next/link";

export function Header() {
  return (
    <header className="bg-hb-900 text-text-on-blue shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="font-display text-2xl font-bold tracking-wide group-hover:text-coral-light transition-colors">
            HappyCake
          </span>
          <span className="text-[11px] text-hb-200 font-body tracking-wider uppercase">
            Sugar Land, TX
          </span>
        </Link>
        <nav className="flex items-center gap-7 text-sm font-body font-medium">
          <Link
            href="/cakes"
            className="text-cream-50 hover:text-coral-light transition-colors"
          >
            Our Cakes
          </Link>
          <Link
            href="/custom"
            className="text-cream-50 hover:text-coral-light transition-colors"
          >
            Custom Orders
          </Link>
          <Link
            href="/about"
            className="text-cream-50 hover:text-coral-light transition-colors"
          >
            About
          </Link>
          <Link
            href="/policies"
            className="text-cream-50 hover:text-coral-light transition-colors"
          >
            Policies
          </Link>
          <Link
            href="/cakes"
            className="bg-coral text-cream-50 px-5 py-2 rounded-lg hover:bg-coral-light hover:text-hb-900 transition-all font-semibold shadow-sm"
          >
            Order Now
          </Link>
        </nav>
      </div>
    </header>
  );
}
