'use client';

import { useEffect } from 'react';

// Injects reCAPTCHA Enterprise script manually via useEffect to avoid
// Next.js Script component querySelector crash with special chars in site key
export default function RecaptchaLoader() {
  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (!siteKey) return;

    // Don't inject twice
    if (document.querySelector('script[data-recaptcha]')) return;

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-recaptcha', 'true');
    document.head.appendChild(script);
  }, []);

  return null;
}
