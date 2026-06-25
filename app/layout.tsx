import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { cookies } from "next/headers";
import type { User } from "@/lib/api";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Craftea - L'artisanat authentique",
  description: "Découvrez des créations uniques faites à la main par des artisans passionnés. Bijoux, céramique, textile et bien plus.",
  keywords: "artisanat, fait main, créations uniques, artisans, marketplace",
  icons: {
    icon: "/favicon.png",
  },
};

async function getInitialUser(): Promise<User | null | undefined> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken) return null;
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const res = await fetch(`${apiBase}/api/auth/me`, {
      headers: { Cookie: `accessToken=${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    // Backend unreachable — return undefined so the client retries client-side.
    // (null would be treated as "confirmed unauthenticated" and skip the retry.)
    return undefined;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialUser = await getInitialUser();

  return (
    <html lang="fr" className="scroll-smooth" suppressHydrationWarning>
      <Script
        src="https://craftea.ddnsfree.com:3009/script.js"
        data-website-id={
          process.env.NODE_ENV === "production"
            ? "2ede8fe0-7bce-4ded-8920-069a294b8b46"
            : "eb09285b-2326-4dc6-8de8-133a375b3a37"
        }
        strategy="afterInteractive"
      />
      <body
        suppressHydrationWarning
        className={`${inter.variable} min-h-screen bg-white font-sans text-stone-800 antialiased transition-colors dark:bg-stone-950 dark:text-stone-200`}
      >
        <Providers initialUser={initialUser}>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)] transition-colors">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}