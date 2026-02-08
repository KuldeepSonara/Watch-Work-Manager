import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/lib/LanguageContext";
import Navigation from "@/components/Navigation";
import { InstallPrompt } from "@/components/InstallPrompt";
import { SpeedInsights } from "@vercel/speed-insights/next"
import "./globals.css";

export const metadata: Metadata = {
  title: "Watch Work Manager | ઘડિયાળ કામ મેનેજર",
  description: "Simple watch assembly work management system",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="gu" className="dark">
      <body className="dark bg-slate-950 text-white antialiased">
        <LanguageProvider>
          <Navigation />
          {/* Main content: padding for top nav on desktop, bottom nav on mobile */}
          <main className="container pt-4 pb-24 md:pt-20 md:pb-8">
            {children}
          </main>
          <Toaster
            position="top-center"
            richColors
            closeButton
            duration={3000}
            theme="dark"
          />
          <SpeedInsights />
          <InstallPrompt />
        </LanguageProvider>
      </body>
    </html>
  );
}
