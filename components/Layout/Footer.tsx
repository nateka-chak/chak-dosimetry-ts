'use client';

import { Facebook, Twitter, Linkedin, Mail, Phone, MapPin, Heart } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Organization Info */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-heading">Christian Health Association of Kenya</h3>
                <p className="text-gray-300 text-sm">Healthcare with Compassion & Impact</p>
              </div>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Providing comprehensive healthcare services and medical equipment management 
              across Kenya through our network of faith-based health facilities.
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+254 70 594 94 94</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>admin@cbslkenya.co.ke</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 font-heading">Quick Links</h4>
            <div className="space-y-3">
  {[
    { label: 'About CHAK' },
    { label: 'Our Services' },
    { label: 'Member Hospitals' },
    { label: 'Contact Us' },
    { label: 'Careers' },
  ].map((link) => (
    <a
      key={link.label}
      href="https://www.cbslkenya.co.ke/"
      target="_blank"
      rel="noopener noreferrer"
      className="block text-gray-400 hover:text-white transition-colors duration-200 text-sm"
    >
      {link.label}
    </a>
  ))}
</div>

          </div>

          {/* System Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 font-heading">System</h4>
            <div className="space-y-3">
              {[
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms', label: 'Terms of Service' },
                { href: '/support', label: 'Technical Support' },
                { href: '/documentation', label: 'Documentation' },
                { href: '/feedback', label: 'Send Feedback' },
              ].map((link) => (
                <a
      key={link.label}
      href="https://www.chak.or.ke/"
      target="_blank"
      rel="noopener noreferrer"
      className="block text-gray-400 hover:text-white transition-colors duration-200 text-sm"
    >
      {link.label}
    </a>
              ))}
            </div>
          </div>
        </div>

        {/* Social & Contact Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm">Follow us:</span>
              <div className="flex items-center space-x-3">
                {[
                  { icon: Facebook, href: 'https://facebook.com/cbslkenya', label: 'Facebook' },
                  { icon: Twitter, href: 'https://twitter.com/cbslkenya', label: 'Twitter' },
                  { icon: Linkedin, href: 'https://linkedin.com/cbslkenya', label: 'LinkedIn' },
                ].map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      aria-label={social.label}
                      className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary-600 transition-all duration-200"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Address */}
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>Musa Gitau Road, Off Wiyaki Way, Nairobi, Kenya</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-950 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm">
                © {currentYear} Christian Health Association of Kenya. All rights reserved.
              </p>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>Dosimeter Tracking System</span>
              <span className="text-primary-400 font-medium">v2.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}