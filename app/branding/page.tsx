import React from 'react';
import BrandingManagement from '@/components/branding/BrandingManagement';

export const metadata = {
  title: 'Branding Management | Secure File Share',
  description: 'Manage your custom branding, logo, colors, and white-label settings',
};

export default function BrandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <BrandingManagement />
    </div>
  );
}
