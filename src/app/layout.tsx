import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Watch Work Manager | ઘડિયાળ કામ મેનેજર",
  description: "Simple watch assembly work management system",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
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
