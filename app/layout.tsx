import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
};

async function getInitialUser(): Promise<User | null> {
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
    return null;
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