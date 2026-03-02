import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Craftea - L'artisanat authentique",
  description: "Découvrez des créations uniques faites à la main par des artisans passionnés. Bijoux, céramique, textile et bien plus.",
  keywords: "artisanat, fait main, créations uniques, artisans, marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body suppressHydrationWarning className={`${inter.variable} min-h-screen bg-white font-sans text-stone-800 antialiased`}>
        <Providers>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)]">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
