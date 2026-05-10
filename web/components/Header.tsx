"use client";

import { useState } from "react";
import Link from "next/link";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white/90 backdrop-blur-md text-hb-900 shadow-sm sticky top-0 z-40 border-b border-hb-200/40">
      <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="font-display text-2xl font-bold tracking-wide text-hb-700 group-hover:text-hb-500 transition-colors">
            HappyCake
          </span>
          <span className="text-[11px] text-hb-400 font-body tracking-wider uppercase hidden sm:inline">
            Sugar Land, TX
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-body font-medium">
          <Link href="/cakes" className="text-hb-700 hover:text-coral transition-colors">
            Our Cakes
          </Link>
          <Link href="/custom" className="text-hb-700 hover:text-coral transition-colors">
            Custom Orders
          </Link>
          <Link href="/about" className="text-hb-700 hover:text-coral transition-colors">
            About
          </Link>
          <Link href="/policies" className="text-hb-700 hover:text-coral transition-colors">
            Policies
          </Link>
          <Link
            href="/cakes"
            className="bg-coral text-cream-50 px-5 py-2 rounded-lg hover:bg-coral-light hover:text-hb-900 transition-all font-semibold shadow-sm"
          >
            Order Now
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-hb-50 transition-colors"
          aria-label="Toggle menu"
        >
          <span className={`block w-5 h-0.5 bg-hb-700 transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-5 h-0.5 bg-hb-700 transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-0.5 bg-hb-700 transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-hb-200/40 bg-white px-4 pb-4 pt-2 space-y-1 animate-[slideDown_0.2s_ease-out]">
          <Link href="/cakes" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 text-hb-700 hover:text-coral hover:bg-hb-50 rounded-lg font-body text-sm font-medium transition-colors">
            Our Cakes
          </Link>
          <Link href="/custom" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 text-hb-700 hover:text-coral hover:bg-hb-50 rounded-lg font-body text-sm font-medium transition-colors">
            Custom Orders
          </Link>
          <Link href="/about" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 text-hb-700 hover:text-coral hover:bg-hb-50 rounded-lg font-body text-sm font-medium transition-colors">
            About
          </Link>
          <Link href="/policies" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 text-hb-700 hover:text-coral hover:bg-hb-50 rounded-lg font-body text-sm font-medium transition-colors">
            Policies
          </Link>
          <Link href="/cakes" onClick={() => setMenuOpen(false)} className="block mt-2 text-center bg-coral text-cream-50 px-5 py-2.5 rounded-lg font-body text-sm font-semibold shadow-sm">
            Order Now
          </Link>
        </div>
      )}
    </header>
  );
}
