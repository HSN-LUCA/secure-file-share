# Secure File Share - Project Setup

## Overview

This is a Next.js 14 application for secure file sharing with unique numeric codes. The project is built with TypeScript, React 18, and Tailwind CSS.

## Project Structure

```
secure-file-share/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
├── lib/                   # Utility functions and helpers
├── types/                 # TypeScript type definitions
├── public/                # Static assets
├── .env.example           # Environment variables template
├── next.config.ts         # Next.js configuration
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.ts     # Tailwind CSS configuration
├── postcss.config.mjs     # PostCSS configuration
└── package.json           # Dependencies and scripts
```

## Technology Stack

- **Framework**: Next.js 14 with React 18
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL (Supabase)
- **Object Storage**: AWS S3 or Cloudflare R2
- **Authentication**: JWT
- **Payments**: Stripe
- **Rate Limiting**: Redis
- **Virus Scanning**: ClamAV or VirusTotal API
- **Bot Detection**: reCAPTCHA v3

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Supabase recommended)
- AWS S3 or Cloudflare R2 account
- reCAPTCHA v3 keys
- Stripe account (for payments)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your configuration values.

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Configuration Files

### TypeScript Configuration (`tsconfig.json`)
- Target: ES2017
- Strict mode enabled
- Path aliases configured (`@/*`)
- JSX: react-jsx

### Next.js Configuration (`next.config.ts`)
- Ready for customization
- Supports API routes
- Supports middleware

### Tailwind CSS Configuration
- Tailwind CSS 4 with PostCSS
- Responsive design support
- Dark mode support

## Features (Phase 1 - MVP)

- ✅ Next.js 14 with TypeScript
- ✅ Tailwind CSS styling
- ✅ Project structure setup
- ✅ Environment configuration
- ⏳ File upload API
- ⏳ File download API
- ⏳ Database schema
- ⏳ Virus scanning
- ⏳ Rate limiting
- ⏳ Bot detection

## Next Steps

1. **Task 1.2**: Configure Tailwind CSS and project structure
2. **Task 1.3**: Set up Supabase PostgreSQL database
3. **Task 1.4**: Configure AWS S3 or Cloudflare R2
4. **Task 1.5**: Set up environment variables and secrets management
5. **Task 1.6**: Configure Vercel deployment pipeline

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Use Tailwind CSS for styling
- Keep components small and focused

### File Organization
- API routes in `app/api/`
- React components in `components/`
- Utilities in `lib/`
- Types in `types/`

### Environment Variables
- Never commit `.env.local`
- Use `.env.example` as template
- All sensitive keys in environment variables

## Deployment

The project is configured for deployment on Vercel:

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

## Support

For issues or questions, refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
