import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KingWatch — Kingshots Alliance Intelligence",
  description: "Track alliance power rankings across every Kingshots kingdom.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100 font-[family-name:var(--font-geist-sans)]">
        <header className="border-b border-gray-800 bg-gray-900">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <span className="text-amber-400">⚔</span>
              <span>KingWatch</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm text-gray-400">
              <Link href="/kingdoms" className="hover:text-white transition-colors">Kingdoms</Link>
              <Link href="/submit" className="hover:text-white transition-colors">Submit Data</Link>
              <Link href="/submit" className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-3 py-1.5 rounded-md transition-colors text-xs">
                Upload Rankings
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t border-gray-800 py-6 text-center text-xs text-gray-600">
          KingWatch — Community-powered Kingshots intelligence
        </footer>
      </body>
    </html>
  );
}
