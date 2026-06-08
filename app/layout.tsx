import type { Metadata } from "next";
import { Suspense } from "react";
import { Space_Grotesk, Bitter } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

const headingFont = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = Bitter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Huaman.com | Marketplace",
  description: "Marketplace estilo OLX con Ropa, Electrónica y Hogar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${headingFont.variable} ${bodyFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <Header />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
