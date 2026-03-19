'use client';

import { useRef, useState } from 'react';
import { motion } from 'motion/react';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  disabled?: boolean;
  as?: 'button' | 'a';
  href?: string;
  strength?: number;
}

export default function MagneticButton({
  children,
  className = '',
  style,
  onClick,
  disabled,
  as = 'button',
  href,
  strength = 0.35,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setPos({
      x: (e.clientX - cx) * strength,
      y: (e.clientY - cy) * strength,
    });
  };

  const handleMouseLeave = () => setPos({ x: 0, y: 0 });

  const inner = (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: 'spring', stiffness: 200, damping: 18, mass: 0.5 }}
      style={{ display: 'inline-block' }}
    >
      {as === 'a' ? (
        <a href={href} className={className} style={style} onClick={onClick}>
          {children}
        </a>
      ) : (
        <button
          className={className}
          style={style}
          onClick={onClick}
          disabled={disabled}
        >
          {children}
        </button>
      )}
    </motion.div>
  );

  return inner;
}
