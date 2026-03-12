# Component Structure Guide

## Overview

This document describes the organized component structure for the Secure File Share application. The project follows a scalable, modular architecture that separates concerns and promotes code reusability.

## Directory Structure

```
components/
├── ui/                          # Reusable UI components
│   ├── Button.tsx              # Button component with variants
│   ├── Card.tsx                # Card component with sub-components
│   ├── Input.tsx               # Input field component
│   ├── Alert.tsx               # Alert/notification component
│   └── index.ts                # Barrel export
├── layout/                      # Layout components
│   ├── Header.tsx              # Application header
│   ├── Footer.tsx              # Application footer
│   ├── Container.tsx           # Container wrapper
│   └── index.ts                # Barrel export
├── features/                    # Feature-specific components (to be added)
│   ├── upload/                 # Upload feature components
│   ├── download/               # Download feature components
│   └── auth/                   # Authentication components
└── .gitkeep                    # Placeholder

lib/
├── classNames.ts               # Utility for class name management
├── constants.ts                # Application-wide constants
├── validation.ts               # Input validation utilities
└── (other utilities)           # Additional helper functions

types/
├── index.ts                    # TypeScript type definitions
└── (domain types)              # Feature-specific types
```

## UI Components

### Button

Reusable button component with multiple variants and sizes.

**Props:**
- `variant`: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline'
- `size`: 'sm' | 'md' | 'lg'
- `isLoading`: boolean (shows loading spinner)
- `disabled`: boolean
- `children`: React.ReactNode

**Usage:**
```tsx
import { Button } from '@/components/ui';

export default function Example() {
  return (
    <>
      <Button variant="primary" size="md">
        Click me
      </Button>
      <Button variant="outline" isLoading>
        Loading...
      </Button>
    </>
  );
}
```

### Card

Flexible card component with header, body, and footer sections.

**Components:**
- `Card`: Main container
- `CardHeader`: Header section with border
- `CardBody`: Main content area
- `CardFooter`: Footer section with background

**Usage:**
```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui';

export default function Example() {
  return (
    <Card>
      <CardHeader>
        <h2>Card Title</h2>
      </CardHeader>
      <CardBody>
        <p>Card content goes here</p>
      </CardBody>
      <CardFooter>
        <button>Action</button>
      </CardFooter>
    </Card>
  );
}
```

### Input

Form input component with label, error, and helper text support.

**Props:**
- `label`: string (optional)
- `error`: string (optional, shows error state)
- `helperText`: string (optional)
- `type`: HTML input type
- `placeholder`: string
- `disabled`: boolean
- All standard HTML input attributes

**Usage:**
```tsx
import { Input } from '@/components/ui';

export default function Example() {
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');

  return (
    <Input
      label="Email Address"
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      error={error}
      helperText="We'll never share your email"
      placeholder="you@example.com"
    />
  );
}
```

### Alert

Alert/notification component for displaying messages.

**Props:**
- `type`: 'success' | 'error' | 'warning' | 'info'
- `title`: string (optional)
- `children`: React.ReactNode

**Usage:**
```tsx
import { Alert } from '@/components/ui';

export default function Example() {
  return (
    <>
      <Alert type="success" title="Success!">
        Your file has been uploaded successfully.
      </Alert>
      <Alert type="error">
        An error occurred. Please try again.
      </Alert>
    </>
  );
}
```

## Layout Components

### Header

Application header with navigation.

**Props:**
- `title`: string (default: 'Secure File Share')
- `subtitle`: string (optional)

**Usage:**
```tsx
import { Header } from '@/components/layout';

export default function Example() {
  return <Header title="My App" subtitle="Subtitle" />;
}
```

### Footer

Application footer with links and copyright.

**Usage:**
```tsx
import { Footer } from '@/components/layout';

export default function Example() {
  return <Footer />;
}
```

### Container

Responsive container wrapper with max-width constraints.

**Props:**
- `size`: 'sm' | 'md' | 'lg' | 'xl' (default: 'lg')
- `children`: React.ReactNode

**Usage:**
```tsx
import { Container } from '@/components/layout';

export default function Example() {
  return (
    <Container size="lg">
      <h1>Content</h1>
    </Container>
  );
}
```

## Utility Functions

### classNames

Conditionally join class names together.

**Usage:**
```tsx
import { classNames } from '@/lib/classNames';

const classes = classNames(
  'base-class',
  isActive && 'active-class',
  isDisabled && 'disabled-class'
);
```

### Validation Functions

Located in `lib/validation.ts`:

- `validateEmail(email)` - Validates email format
- `validatePassword(password)` - Validates password strength
- `validateShareCode(code)` - Validates share code format
- `validateFileExtension(filename)` - Checks if file type is allowed
- `validateMimeType(filename, mimeType)` - Validates MIME type matches extension
- `validateFileSize(fileSize, plan, isVideo)` - Validates file size limits
- `sanitizeFilename(filename)` - Removes dangerous characters from filename
- `sanitizeInput(input)` - Prevents XSS attacks
- `formatFileSize(bytes)` - Formats bytes to human-readable size

**Usage:**
```tsx
import { validateEmail, formatFileSize } from '@/lib/validation';

if (!validateEmail(email)) {
  setError('Invalid email format');
}

const displaySize = formatFileSize(1024 * 1024); // "1 MB"
```

### Constants

Located in `lib/constants.ts`:

- `FILE_CONSTRAINTS` - File size and duration limits per plan
- `ALLOWED_FILE_TYPES` - Allowed file extensions by category
- `MIME_TYPES` - MIME type mappings
- `ERROR_MESSAGES` - Standardized error messages
- `SUCCESS_MESSAGES` - Standardized success messages
- `API_ENDPOINTS` - API route paths
- `PATTERNS` - Regex patterns for validation
- `STORAGE_KEYS` - Local storage key names

**Usage:**
```tsx
import { FILE_CONSTRAINTS, ERROR_MESSAGES } from '@/lib/constants';

const maxSize = FILE_CONSTRAINTS.FREE_PLAN.MAX_FILE_SIZE;
const errorMsg = ERROR_MESSAGES.FILE_TOO_LARGE;
```

## Styling System

### CSS Variables

The application uses CSS custom properties for theming. All variables are defined in `app/globals.css`:

**Light Mode (Default):**
- `--background`: #ffffff
- `--foreground`: #111827
- `--primary`: #0ea5e9
- `--secondary`: #8b5cf6
- `--success`: #22c55e
- `--warning`: #f59e0b
- `--error`: #ef4444

**Dark Mode:**
- Automatically applied via `prefers-color-scheme: dark`
- Can be manually toggled with `.dark` class

### Tailwind CSS Configuration

The project uses Tailwind CSS 4 with custom theme extensions:

**Custom Colors:**
- Primary, Secondary, Success, Warning, Error color scales
- Neutral color scale for grayscale

**Custom Spacing:**
- Consistent spacing scale from 0 to 64rem

**Custom Border Radius:**
- Predefined radius values for consistency

**Dark Mode:**
- Supports both system preference and class-based toggle

### Responsive Design

All components are built with mobile-first responsive design:

```tsx
// Example responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Responsive grid */}
</div>
```

## Best Practices

### Component Organization

1. **UI Components** (`components/ui/`): Reusable, generic components
2. **Layout Components** (`components/layout/`): Page structure components
3. **Feature Components** (`components/features/`): Feature-specific components

### Naming Conventions

- Components: PascalCase (e.g., `Button.tsx`)
- Utilities: camelCase (e.g., `classNames.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `FILE_CONSTRAINTS`)

### Props and Types

- Always define TypeScript interfaces for component props
- Use `React.forwardRef` for components that need ref access
- Export component display names for debugging

### Styling

- Use Tailwind CSS utility classes for styling
- Use CSS variables for theme colors
- Avoid inline styles
- Use dark mode classes for dark theme support

### Accessibility

- Use semantic HTML elements
- Add ARIA labels where needed
- Ensure keyboard navigation support
- Use `sr-only` class for screen reader only content

## Adding New Components

### Step 1: Create Component File

```tsx
// components/ui/NewComponent.tsx
import React from 'react';

interface NewComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

const NewComponent = React.forwardRef<HTMLDivElement, NewComponentProps>(
  ({ variant = 'primary', className = '', ...props }, ref) => (
    <div ref={ref} className={`base-styles ${className}`} {...props} />
  )
);

NewComponent.displayName = 'NewComponent';

export default NewComponent;
```

### Step 2: Update Barrel Export

```tsx
// components/ui/index.ts
export { default as NewComponent } from './NewComponent';
```

### Step 3: Use in Application

```tsx
import { NewComponent } from '@/components/ui';

export default function Page() {
  return <NewComponent variant="primary">Content</NewComponent>;
}
```

## Testing Components

When writing tests for components:

1. Test component rendering
2. Test prop variations
3. Test user interactions
4. Test accessibility
5. Test responsive behavior

Example test structure:
```tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui';

describe('Button', () => {
  it('renders with primary variant', () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

## Performance Considerations

1. **Code Splitting**: Components are automatically code-split by Next.js
2. **Lazy Loading**: Use `React.lazy()` for heavy components
3. **Memoization**: Use `React.memo()` for expensive components
4. **CSS**: Tailwind CSS is optimized and only includes used styles

## Future Enhancements

- [ ] Add Storybook for component documentation
- [ ] Add component tests with React Testing Library
- [ ] Add more feature-specific components
- [ ] Add animation utilities
- [ ] Add form builder components
- [ ] Add data table component
- [ ] Add modal/dialog component
- [ ] Add dropdown/select component
- [ ] Add tabs component
- [ ] Add tooltip component
