import type { Metadata, Viewport } from "next";
import { Sora, Inter, JetBrains_Mono, Noto_Serif_JP } from "next/font/google";
import "./globals.css";
import { OverlayProvider } from "../components/overlay.js";
import { Header } from "../components/shell/header.js";
import { BottomNav } from "../components/shell/nav.js";
import { Ticker } from "../components/shell/ticker.js";
import { Mark } from "../components/marks.js";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });
const notoSerifJp = Noto_Serif_JP({ weight: ["400"], subsets: ["latin"], variable: "--font-noto-serif-jp" });

// viewport-fit=cover so env(safe-area-inset-*) is real on notched phones (CONVENTIONS §7).
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export const metadata: Metadata = {
  title: "Proof League",
  description:
    "A prediction league where real Ethereum events are the matches and cryptographic proof is the referee.",
};

// Pre-paint theme resolution (REFERENCE-DESIGN §3): stored pl.theme.v1 wins, else the system
// preference, applied before content paints so no route ever flashes the wrong theme.
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("pl.theme.v1");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="dark"}})()`;

// One responsive shell for public marketing and the signed-in product (Story 3.1,
// UX-DR4/10): header with the five jobs on desktop, safe-area bottom nav with the SAME
// five on mobile, the live strip, and the overlay coordinator around everything.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sora.variable} ${inter.variable} ${jetbrainsMono.variable} ${notoSerifJp.variable}`}>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <OverlayProvider>
          <Header />
          <Ticker />
          <main className="mx-auto max-w-[1280px] px-6 pb-24 md:px-8 md:pb-12">{children}</main>
          <footer className="mt-16 border-t border-rule">
            <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-6 md:px-8">
              <span className="flex items-center gap-2 font-data text-xs text-ink-muted">
                <Mark id="proof-league" size={14} />
                Proof League
              </span>
              <span className="font-data text-xs text-ink-muted">Free points. Public record. Proof-settled.</span>
            </div>
          </footer>
          <BottomNav />
        </OverlayProvider>
      </body>
    </html>
  );
}
