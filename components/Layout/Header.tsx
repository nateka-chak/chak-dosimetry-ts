'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

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
    <header className="bg-gradient-to-r from-chak-blue-dark to-chak-blue shadow">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo + Title */}
        <Link
          href="/"
          className="flex items-center gap-3 text-white hover:text-yellow-400 transition"
        >
          <Image
            src="/images/logo.png"
            alt="CHAK Logo"
            width={40}
            height={40}
            className="rounded-md"
            priority
          />
          <span className="text-lg md:text-xl font-bold tracking-wide text-white">
            CHAK dosimeter Tracker
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md transition font-medium ${
                  isActive
                    ? '!text-yellow-400 font-semibold'
                    : '!text-gray-100 hover:!text-yellow-200'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded text-white hover:bg-white/10"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle Menu"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-chak-blue-dark px-6 py-4 space-y-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-2 rounded-md font-medium ${
                  isActive
                    ? '!text-yellow-400 font-semibold'
                    : '!text-gray-100 hover:!text-yellow-200'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
