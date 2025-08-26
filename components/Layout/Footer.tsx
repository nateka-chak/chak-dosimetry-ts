'use client';

import { Facebook, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-chak-blue-dark to-chak-blue text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
          {/* Logo / Org Name */}
          <div>
            <h3 className="text-lg font-semibold">Christian Health Association of Kenya</h3>
            <p className="text-sm opacity-80">Healthcare with Impact</p>
          </div>

          {/* Quick Links */}
          <div className="flex justify-center space-x-6">
            <a href="/privacy" className="text-sm hover:text-gray-200 transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="text-sm hover:text-gray-200 transition-colors">
              Terms of Service
            </a>
            <a href="/contact" className="text-sm hover:text-gray-200 transition-colors">
              Contact
            </a>
          </div>

          {/* Social Icons */}
          <div className="flex justify-center md:justify-end space-x-4">
            <a href="https://facebook.com" aria-label="Facebook" className="hover:text-gray-200 transition-colors">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="https://twitter.com" aria-label="Twitter" className="hover:text-gray-200 transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://linkedin.com" aria-label="LinkedIn" className="hover:text-gray-200 transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 mt-8 pt-6 text-center text-sm opacity-80">
          <p>© {new Date().getFullYear()} Christian Health Association of Kenya. All rights reserved.</p>
          <p className="mt-1">Dosimetry Tracking System v1.0</p>
        </div>
      </div>
    </footer>
  );
}
