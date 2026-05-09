import Link from "next/link";

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-sky/20">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🎂</span>
          <span className="text-xl font-bold text-chocolate">Happy Cake</span>
          <span className="text-sm text-sky font-medium">US</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/cakes"
            className="text-chocolate hover:text-sky transition-colors"
          >
            Our Cakes
          </Link>
          <Link
            href="/custom"
            className="text-chocolate hover:text-sky transition-colors"
          >
            Custom Orders
          </Link>
          <Link
            href="/about"
            className="text-chocolate hover:text-sky transition-colors"
          >
            About
          </Link>
          <Link
            href="/policies"
            className="text-chocolate hover:text-sky transition-colors"
          >
            Policies
          </Link>
          <Link
            href="/cakes"
            className="bg-sky text-white px-4 py-2 rounded-lg hover:bg-sky/90 transition-colors"
          >
            Order Now
          </Link>
        </nav>
      </div>
    </header>
  );
}
