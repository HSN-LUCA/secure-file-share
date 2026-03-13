import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
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
  title: "Secure File Share",
  description: "Share files securely with unique numeric codes",
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
            <Header />
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
