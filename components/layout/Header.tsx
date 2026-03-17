'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, User, LogIn } from 'lucide-react';

const Header: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="w-full sticky top-0 z-50"
      style={{ background: 'linear-gradient(135deg, #2d1b69 0%, #4a1d96 50%, #6b21a8 100%)' }}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo area */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          {/* Logo placeholder — replace with <Image> when ready */}
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white border-2"
            style={{ borderColor: '#D4A017', background: 'rgba(255,255,255,0.1)' }}
            title="Your logo goes here"
          >
            {/* LOGO */}
          </div>
          <span
            className="text-lg font-bold"
            style={{ color: '#D4A017', fontFamily: 'monospace' }}
          >
            FileShare
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {['Pricing', 'How It Works', 'Contact'].map(item => (
            <Link
              key={item}
              href={item === 'Pricing' ? '/pricing' : item === 'How It Works' ? '/#how-it-works' : '/support'}
              className="text-sm text-purple-200 hover:text-white transition-colors"
            >
              {item}
            </Link>
          ))}
        </nav>

        {/* Desktop auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-purple-200 hover:text-white border border-purple-400 rounded-full transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            Login
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white rounded-full transition-colors"
            style={{ background: 'linear-gradient(to right, #F5C842, #D4A017)' }}
          >
            <User className="w-3.5 h-3.5" />
            Sign Up
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-purple-200 hover:text-white"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden px-4 pb-4 flex flex-col gap-3"
          style={{ background: 'rgba(45,27,105,0.97)' }}
        >
          {['Pricing', 'How It Works', 'Contact'].map(item => (
            <Link
              key={item}
              href={item === 'Pricing' ? '/pricing' : item === 'How It Works' ? '/#how-it-works' : '/support'}
              className="text-sm text-purple-200 hover:text-white py-1 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              {item}
            </Link>
          ))}
          <div className="flex gap-3 pt-2">
            <Link
              href="/login"
              className="flex-1 text-center py-2 text-sm text-purple-200 border border-purple-400 rounded-full"
              onClick={() => setMobileOpen(false)}
            >
              Login
            </Link>
            <Link
              href="/register"
              className="flex-1 text-center py-2 text-sm font-semibold text-white rounded-full"
              style={{ background: 'linear-gradient(to right, #F5C842, #D4A017)' }}
              onClick={() => setMobileOpen(false)}
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
