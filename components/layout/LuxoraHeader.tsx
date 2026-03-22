'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from 'motion/react';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home', href: '#' },
  { label: 'Upload', href: '#upload' },
  { label: 'Find File', href: '#find' },
  { label: 'VIP', href: '/vip' },
];

interface LuxoraHeaderProps {
  onGetStarted?: () => void;
}

export default function LuxoraHeader({ onGetStarted }: LuxoraHeaderProps) {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState('#');
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastY = useRef(0);
  const { scrollY } = useScroll();

  // Hide on scroll down, show on scroll up
  useMotionValueEvent(scrollY, 'change', (y) => {
    const diff = y - lastY.current;
    if (y > 80) {
      setHidden(diff > 0);
      setScrolled(true);
    } else {
      setHidden(false);
      setScrolled(y > 10);
    }
    lastY.current = y;
  });

  // Track active section via IntersectionObserver
  useEffect(() => {
    const ids = ['upload', 'find'];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveLink(`#${entry.target.id}`);
          }
        }
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 pt-4"
        initial={{ y: -100 }}
        animate={{ y: hidden ? -120 : 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        <nav
          className="flex items-center justify-between w-full max-w-5xl px-5 sm:px-6 py-3 rounded-2xl transition-shadow duration-300"
          style={{
            background: scrolled ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(220,210,195,0.45)',
            boxShadow: scrolled
              ? '0 4px 32px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.05)'
              : '0 2px 16px rgba(0,0,0,0.04)',
          }}
        >
          {/* Logo — animated icon + brand name */}
          <a href="#" className="flex items-center gap-2.5 flex-shrink-0" style={{ textDecoration: 'none' }}>
            <motion.div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #F5C842, #D4A017)' }}
              whileHover={{ rotate: 12, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            >
              <span className="text-white font-bold text-sm">H</span>
            </motion.div>
            <span className="font-bold text-base" style={{ color: '#1a1a2e' }}>HodHod</span>
          </a>

          {/* Center links — desktop */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, href }) => {
              const isActive = activeLink === href;
              return (
                <a
                  key={label}
                  href={href}
                  onClick={() => setActiveLink(href)}
                  className="relative px-4 py-2 text-sm font-semibold transition-colors duration-200"
                  style={{
                    color: isActive ? '#1a1a2e' : '#9ca3af',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = '#4b5563'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = '#9ca3af'; }}
                >
                  {label}
                  {/* Active dot indicator */}
                  {isActive && (
                    <motion.span
                      className="absolute bottom-0 left-1/2 w-1 h-1 rounded-full"
                      style={{ background: '#D4A017', x: '-50%' }}
                      layoutId="nav-dot"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </a>
              );
            })}
          </div>

          {/* Right side — CTA + hamburger */}
          <div className="flex items-center gap-3">
            <motion.button
              onClick={onGetStarted}
              className="hidden sm:block px-5 py-2 rounded-xl text-sm font-bold text-white cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #1a1a2e, #2d2d4e)',
                border: 'none',
              }}
              whileHover={{
                boxShadow: '0 0 20px rgba(26,26,46,0.4), 0 0 40px rgba(26,26,46,0.15)',
              }}
              transition={{ duration: 0.2 }}
            >
              Get Started
            </motion.button>

            {/* Hamburger — mobile */}
            <button
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: '#374151' }}
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile slide-in panel */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.3)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            {/* Panel */}
            <motion.div
              className="fixed top-0 right-0 bottom-0 z-50 w-72 flex flex-col px-6 py-8"
              style={{
                background: 'rgba(255,255,255,0.97)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
              }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Close button */}
              <button
                className="self-end p-2 rounded-lg mb-6"
                style={{ color: '#374151' }}
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Mobile nav links */}
              <div className="flex flex-col gap-2">
                {NAV_LINKS.map(({ label, href }) => {
                  const isActive = activeLink === href;
                  return (
                    <a
                      key={label}
                      href={href}
                      onClick={() => { setActiveLink(href); setMobileOpen(false); }}
                      className="px-4 py-3 rounded-xl text-base font-semibold transition-colors"
                      style={{
                        color: isActive ? '#1a1a2e' : '#9ca3af',
                        background: isActive ? 'rgba(212,160,23,0.08)' : 'transparent',
                        textDecoration: 'none',
                      }}
                    >
                      {label}
                    </a>
                  );
                })}
              </div>

              {/* Mobile CTA */}
              <button
                onClick={() => { setMobileOpen(false); onGetStarted?.(); }}
                className="mt-8 w-full py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #1a1a2e, #2d2d4e)' }}
              >
                Get Started
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
