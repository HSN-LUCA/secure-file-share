'use client';

import React from 'react';
import Link from 'next/link';

const Header: React.FC = () => {
  return (
    <header className="w-full bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span
            className="text-xl font-bold"
            style={{ fontFamily: 'monospace', color: '#D4A017' }}
          >
            FileShare
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: 'Pricing', href: '/pricing' },
            { label: 'How It Works', href: '/#how-it-works' },
            { label: 'Contact', href: '/support' },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold text-white px-4 py-2 rounded-full transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(to right, #F5C842, #D4A017)' }}
          >
            Sign Up
          </Link>
        </div>

      </div>
    </header>
  );
};

export default Header;
