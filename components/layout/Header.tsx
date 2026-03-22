'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex-shrink-0">
          <span className="text-lg font-bold text-gray-900">Hodhod</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
          <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
          <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">About</a>
          <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
        </nav>

        {/* Right Side - Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-2">
            Sign In
          </button>
          <button className="text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors px-4 py-2 rounded-lg">
            Get Started
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-6 py-4 space-y-3">
            <a href="#" className="block text-sm text-gray-600 hover:text-gray-900">Features</a>
            <a href="#" className="block text-sm text-gray-600 hover:text-gray-900">Pricing</a>
            <a href="#" className="block text-sm text-gray-600 hover:text-gray-900">About</a>
            <a href="#" className="block text-sm text-gray-600 hover:text-gray-900">Contact</a>
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <button className="w-full text-sm text-gray-600 hover:text-gray-900 py-2">
                Sign In
              </button>
              <button className="w-full text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 py-2 rounded-lg">
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
