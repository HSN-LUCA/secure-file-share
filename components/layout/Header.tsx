'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import MagneticButton from '@/components/ui/MagneticButton';

const Header: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xl font-bold" style={{ fontFamily: 'monospace', color: '#D4A017' }}>
            FileShare
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: 'Pricing', href: '/pricing' },
            { label: 'How It Works', href: '/#how-it-works' },
            { label: 'Contact', href: '/support' },
          ].map(({ label, href }) => (
            <Link key={label} href={href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          <MagneticButton as="a" href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-2 py-1">
            Login
          </MagneticButton>
          <MagneticButton
            as="a"
            href="/register"
            className="text-sm font-semibold text-white px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(to right, #F5C842, #D4A017)' }}
          >
            Sign Up
          </MagneticButton>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-gray-500 hover:text-gray-900"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-4">
          {[
            { label: 'Pricing', href: '/pricing' },
            { label: 'How It Works', href: '/#how-it-works' },
            { label: 'Contact', href: '/support' },
          ].map(({ label, href }) => (
            <Link key={label} href={href} className="text-sm text-gray-600 hover:text-gray-900" onClick={() => setOpen(false)}>
              {label}
            </Link>
          ))}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <Link href="/login" className="flex-1 text-center py-2 text-sm text-gray-600 border border-gray-200 rounded-full" onClick={() => setOpen(false)}>
              Login
            </Link>
            <Link
              href="/register"
              className="flex-1 text-center py-2 text-sm font-semibold text-white rounded-full"
              style={{ background: 'linear-gradient(to right, #F5C842, #D4A017)' }}
              onClick={() => setOpen(false)}
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
