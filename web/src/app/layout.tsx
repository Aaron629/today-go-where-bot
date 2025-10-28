import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "今天去哪兒｜官方網站",
  description: "用輪盤幫你快速決定吃什麼、喝什麼、去哪玩。",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <body
        className={[
          geistSans.variable,
          geistMono.variable,
          // 基底：套用你在 globals.css 定義的 CSS 變數
          "antialiased min-h-dvh grid grid-rows-[auto,1fr,auto]",
          "bg-[--background] text-[--foreground]",
        ].join(" ")}
      >
        {/* Header */}
        <header className="border-b border-black/10 backdrop-blur sticky top-0 z-50 bg-[--background]/80">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <a href="/" className="font-bold text-lg tracking-tight">
              今天去哪兒
            </a>
            <nav className="text-sm">
              <a href="/roulette" className="px-3 py-1 rounded hover:bg-black/5">
                三餐輪盤
              </a>
              <a href="/spots" className="px-3 py-1 rounded hover:bg-black/5">
                隨機景點
              </a>
              <a href="/about" className="px-3 py-1 rounded hover:bg-black/5">
                關於
              </a>
            </nav>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-6xl px-4 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-black/10">
          <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-black/60">
            © {new Date().getFullYear()} 今天去哪兒 · Built with Next.js & Tailwind CSS
          </div>
        </footer>
      </body>
    </html>
  );
}
