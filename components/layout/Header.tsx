'use client';

import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur border-b z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="text-xl font-bold">Hodhod</div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#" className="hover:text-blue-600">Product</a>
          <a href="#" className="hover:text-blue-600">Solutions</a>
          <a href="#" className="hover:text-blue-600">Pricing</a>
          <a href="#" className="hover:text-blue-600">Docs</a>
        </nav>

        {/* Right Side */}
        <div className="hidden md:flex items-center gap-4">
          <button className="text-sm">Login</button>
          <button className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:opacity-90">
            Start Building
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden px-6 pb-4 space-y-4 bg-white border-t">
          <a href="#" className="block">Product</a>
          <a href="#" className="block">Solutions</a>
          <a href="#" className="block">Pricing</a>
          <a href="#" className="block">Docs</a>

          <button className="w-full border py-2 rounded-lg">Login</button>
          <button className="w-full bg-black text-white py-2 rounded-lg">
            Start Building
          </button>
        </div>
      )}
    </header>
  );
}
