# Styling Guide

## Overview

This guide explains the styling system used in the Secure File Share application. The project uses Tailwind CSS 4 with custom theme extensions and CSS variables for a consistent, maintainable design system.

## CSS Variables System

### Light Mode (Default)

All CSS variables are defined in `app/globals.css` and automatically applied in light mode:

```css
:root {
  /* Background & Foreground */
  --background: #ffffff;
  --foreground: #111827;
  --background-secondary: #f9fafb;
  --background-tertiary: #f3f4f6;

  /* Text Colors */
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
  --text-inverse: #ffffff;

  /* Border Colors */
  --border-primary: #e5e7eb;
  --border-secondary: #d1d5db;
  --border-light: #f3f4f6;

  /* Brand Colors */
  --primary: #0ea5e9;
  --primary-dark: #0284c7;
  --primary-light: #7dd3fc;
  --secondary: #8b5cf6;
  --secondary-dark: #7c3aed;
  --secondary-light: #c4b5fd;

  /* Status Colors */
  --success: #22c55e;
  --success-light: #86efac;
  --warning: #f59e0b;
  --warning-light: #fcd34d;
  --error: #ef4444;
  --error-light: #fca5a5;
  --info: #0ea5e9;
  --info-light: #7dd3fc;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), ...;
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), ...;
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), ...;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;

  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;

  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-base: 200ms ease-in-out;
  --transition-slow: 300ms ease-in-out;

  /* Z-Index */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}
```

### Dark Mode

Dark mode is automatically applied when:
1. System preference is set to dark mode (`prefers-color-scheme: dark`)
2. `.dark` class is added to the `<html>` element

Dark mode variables override light mode variables with appropriate colors for dark backgrounds.

## Tailwind CSS Configuration

### Color Palette

The project extends Tailwind's default colors with custom scales:

**Primary Colors (Sky Blue):**
```
primary-50: #f0f9ff
primary-100: #e0f2fe
primary-200: #bae6fd
primary-300: #7dd3fc
primary-400: #38bdf8
primary-500: #0ea5e9 (main)
primary-600: #0284c7
primary-700: #0369a1
primary-800: #075985
primary-900: #0c3d66
```

**Secondary Colors (Purple):**
```
secondary-50: #f5f3ff
secondary-100: #ede9fe
secondary-200: #ddd6fe
secondary-300: #c4b5fd
secondary-400: #a78bfa
secondary-500: #8b5cf6 (main)
secondary-600: #7c3aed
secondary-700: #6d28d9
secondary-800: #5b21b6
secondary-900: #4c1d95
```

**Status Colors:**
- Success: Green scale
- Warning: Amber scale
- Error: Red scale
- Info: Sky blue scale

**Neutral Colors:**
- Used for text, borders, and backgrounds
- 50-900 scale for flexibility

### Typography

**Font Families:**
- Sans: Geist Sans (default)
- Mono: Geist Mono (code)

**Font Sizes:**
```
xs: 0.75rem (12px)
sm: 0.875rem (14px)
base: 1rem (16px)
lg: 1.125rem (18px)
xl: 1.25rem (20px)
2xl: 1.5rem (24px)
3xl: 1.875rem (30px)
4xl: 2.25rem (36px)
5xl: 3rem (48px)
```

### Spacing Scale

Consistent spacing from 0 to 64rem (1024px):
```
0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64
```

### Border Radius

```
none: 0
sm: 0.125rem (2px)
base: 0.25rem (4px)
md: 0.375rem (6px)
lg: 0.5rem (8px)
xl: 0.75rem (12px)
2xl: 1rem (16px)
3xl: 1.5rem (24px)
full: 9999px (circle)
```

### Shadows

```
sm: Small shadow for subtle depth
base: Default shadow for cards
md: Medium shadow for elevated elements
lg: Large shadow for modals
xl: Extra large shadow for important overlays
2xl: Maximum shadow for emphasis
```

## Using Tailwind CSS

### Basic Usage

```tsx
// Simple styling
<div className="bg-white dark:bg-neutral-800 rounded-lg p-4">
  <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
    Title
  </h1>
</div>

// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>

// Conditional styling
<button className={`
  px-4 py-2 rounded-lg
  ${isActive ? 'bg-primary-500 text-white' : 'bg-neutral-200 text-neutral-900'}
  hover:opacity-90 transition-opacity
`}>
  Click me
</button>
```

### Dark Mode

```tsx
// Automatic dark mode support
<div className="bg-white dark:bg-neutral-800">
  <p className="text-neutral-900 dark:text-neutral-100">
    This text adapts to dark mode
  </p>
</div>

// Using CSS variables
<div style={{ backgroundColor: 'var(--background)' }}>
  Content
</div>
```

### Responsive Breakpoints

```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

**Usage:**
```tsx
<div className="
  text-sm md:text-base lg:text-lg
  p-2 md:p-4 lg:p-6
  grid-cols-1 md:grid-cols-2 lg:grid-cols-3
">
  Responsive content
</div>
```

## Using CSS Variables

### In CSS

```css
.custom-element {
  background-color: var(--background);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-md);
  transition: all var(--transition-base);
}
```

### In Inline Styles

```tsx
<div style={{
  backgroundColor: 'var(--background)',
  color: 'var(--text-primary)',
  borderRadius: 'var(--radius-lg)',
}}>
  Content
</div>
```

### In Tailwind Classes

```tsx
// Using Tailwind's color utilities
<div className="bg-primary-500 text-white">
  Primary button
</div>

// Using custom spacing
<div className="p-4 md:p-6 lg:p-8">
  Responsive padding
</div>
```

## Color Usage Guidelines

### Backgrounds

- **Primary Background**: `bg-white dark:bg-neutral-800`
- **Secondary Background**: `bg-neutral-50 dark:bg-neutral-900`
- **Tertiary Background**: `bg-neutral-100 dark:bg-neutral-800`

### Text

- **Primary Text**: `text-neutral-900 dark:text-neutral-100`
- **Secondary Text**: `text-neutral-600 dark:text-neutral-400`
- **Tertiary Text**: `text-neutral-500 dark:text-neutral-500`
- **Inverse Text**: `text-white dark:text-neutral-900`

### Borders

- **Primary Border**: `border-neutral-200 dark:border-neutral-700`
- **Secondary Border**: `border-neutral-300 dark:border-neutral-600`
- **Light Border**: `border-neutral-100 dark:border-neutral-800`

### Interactive Elements

- **Primary Action**: `bg-primary-500 hover:bg-primary-600`
- **Secondary Action**: `bg-secondary-500 hover:bg-secondary-600`
- **Success Action**: `bg-success-500 hover:bg-success-600`
- **Warning Action**: `bg-warning-500 hover:bg-warning-600`
- **Error Action**: `bg-error-500 hover:bg-error-600`

### Status Indicators

- **Success**: `text-success-500` or `bg-success-50 dark:bg-success-900`
- **Warning**: `text-warning-500` or `bg-warning-50 dark:bg-warning-900`
- **Error**: `text-error-500` or `bg-error-50 dark:bg-error-900`
- **Info**: `text-info-500` or `bg-info-50 dark:bg-info-900`

## Component Styling Patterns

### Button Variants

```tsx
// Primary button
<button className="bg-primary-500 text-white hover:bg-primary-600 px-4 py-2 rounded-lg">
  Primary
</button>

// Secondary button
<button className="bg-secondary-500 text-white hover:bg-secondary-600 px-4 py-2 rounded-lg">
  Secondary
</button>

// Outline button
<button className="border-2 border-primary-500 text-primary-500 hover:bg-primary-50 px-4 py-2 rounded-lg">
  Outline
</button>

// Ghost button
<button className="text-primary-500 hover:bg-primary-50 px-4 py-2 rounded-lg">
  Ghost
</button>
```

### Card Styling

```tsx
<div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-md p-6">
  <h2 className="text-xl font-bold mb-4">Card Title</h2>
  <p className="text-neutral-600 dark:text-neutral-400">Card content</p>
</div>
```

### Form Input Styling

```tsx
<input
  type="text"
  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
  placeholder="Enter text"
/>
```

### Alert/Notification Styling

```tsx
// Success alert
<div className="bg-success-50 dark:bg-success-900 border border-success-200 dark:border-success-700 text-success-800 dark:text-success-200 p-4 rounded-lg">
  Success message
</div>

// Error alert
<div className="bg-error-50 dark:bg-error-900 border border-error-200 dark:border-error-700 text-error-800 dark:text-error-200 p-4 rounded-lg">
  Error message
</div>
```

## Animations and Transitions

### Predefined Animations

```
spin: Continuous rotation
ping: Pulsing animation
pulse: Fading pulse
bounce: Bouncing animation
```

### Transition Durations

```
75ms: Very fast
100ms: Fast
150ms: Fast
200ms: Base (default)
300ms: Slow
500ms: Slower
700ms: Very slow
1000ms: Slowest
```

**Usage:**
```tsx
<div className="transition-all duration-200 hover:opacity-80">
  Hover me
</div>

<div className="animate-spin">
  Loading...
</div>
```

## Accessibility

### Color Contrast

- All text meets WCAG AA standards (4.5:1 for normal text)
- Status colors are not the only indicator (use icons/text too)

### Focus States

```tsx
<button className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
  Accessible button
</button>
```

### Screen Reader Only Content

```tsx
<span className="sr-only">Screen reader only text</span>
```

## Performance Tips

1. **Use Tailwind Classes**: Avoid inline styles
2. **Avoid Dynamic Classes**: Use predefined class combinations
3. **Lazy Load Heavy Components**: Use React.lazy()
4. **Optimize Images**: Use Next.js Image component
5. **Minimize CSS**: Tailwind automatically purges unused styles

## Customization

### Adding Custom Colors

Edit `tailwind.config.ts`:
```ts
theme: {
  extend: {
    colors: {
      custom: {
        50: '#f0f9ff',
        // ... more shades
      }
    }
  }
}
```

### Adding Custom Spacing

Edit `tailwind.config.ts`:
```ts
theme: {
  extend: {
    spacing: {
      '128': '32rem',
      '144': '36rem',
    }
  }
}
```

### Adding Custom Animations

Edit `tailwind.config.ts`:
```ts
theme: {
  extend: {
    animation: {
      'fade-in': 'fadeIn 0.5s ease-in',
    },
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      }
    }
  }
}
```

## Best Practices

1. **Use Semantic Colors**: Use `primary`, `success`, `error` instead of specific colors
2. **Maintain Consistency**: Use predefined spacing and sizing
3. **Responsive First**: Design mobile-first, then enhance for larger screens
4. **Dark Mode Support**: Always include dark mode variants
5. **Accessibility**: Ensure sufficient color contrast and focus states
6. **Performance**: Avoid dynamic class generation
7. **Documentation**: Comment complex styling patterns

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind CSS Color Palette](https://tailwindcss.com/docs/customizing-colors)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
