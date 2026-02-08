import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";
import Navigation from "@/components/Navigation";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Watch Work Manager | ઘડિયાળ કામ મેનેજર",
  description: "Simple watch assembly work management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="gu">
      <body>
        <LanguageProvider>
          <Navigation />
          <main className="container">
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  );
}
