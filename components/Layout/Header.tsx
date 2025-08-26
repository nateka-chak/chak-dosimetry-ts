'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dispatch', label: 'Dispatch' },
    { href: '/shipments', label: 'Shipments' },
    { href: '/receive', label: 'Receive' },
  ];

  return (
    <header className="bg-gradient-to-r from-chak-blue-dark to-chak-blue text-white shadow">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo / Title */}
        <h1 className="text-lg md:text-xl font-bold tracking-wide">
          CHAK Dosimetry Tracker
        </h1>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-2 py-1 rounded-md transition-colors ${
                pathname === item.href
                  ? 'bg-white text-chak-blue font-semibold'
                  : 'hover:text-gray-200'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded hover:bg-white/10"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle Menu"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-chak-blue-dark px-6 py-4 space-y-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
              className={`block px-2 py-1 rounded-md ${
                pathname === item.href
                  ? 'bg-white text-chak-blue font-semibold'
                  : 'hover:text-gray-200'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
