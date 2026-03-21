import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/layout/Footer";
import UpdatePrompt from "@/components/pwa/UpdatePrompt";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import OfflineIndicator from "@/components/pwa/OfflineIndicator";
import { LenisWrapper } from "@/components/providers/LenisWrapper";
import RecaptchaLoader from "@/components/captcha/RecaptchaLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HodHod",
  description: "Send files fast and securely with HodHod",
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100`}
      >
        <LenisWrapper>
          <div className="flex flex-col min-h-screen">
            <header className="w-full px-4 py-2 flex items-center bg-white" style={{ borderBottom: '1px solid #F5E9C0' }}>
              <a href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ background: '#0D1B2A' }}>
                  <img src="/logo.png" alt="HodHod" className="w-full h-full object-cover" />
                </div>
                <span className="font-bold text-lg" style={{ color: '#D4A017' }}>HodHod</span>
              </a>
            </header>
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <UpdatePrompt />
          <InstallPrompt />
          <OfflineIndicator />
        </LenisWrapper>
        <RecaptchaLoader />
      </body>
    </html>
  );
}
