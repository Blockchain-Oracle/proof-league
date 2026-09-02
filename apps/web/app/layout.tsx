import type { Metadata } from "next";
import { Sora, Inter, JetBrains_Mono, Noto_Serif_JP } from "next/font/google";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });
const notoSerifJp = Noto_Serif_JP({ weight: ["400"], subsets: ["latin"], variable: "--font-noto-serif-jp" });

export const metadata: Metadata = {
  title: "Proof League",
  description:
    "A prediction league where real Ethereum events are the matches and cryptographic proof is the referee.",
};

// Pre-paint theme resolution (REFERENCE-DESIGN §3): stored pl.theme.v1 wins, else the system
// preference, applied before content paints so no route ever flashes the wrong theme.
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("pl.theme.v1");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="dark"}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sora.variable} ${inter.variable} ${jetbrainsMono.variable} ${notoSerifJp.variable}`}>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {children}
      </body>
    </html>
  );
}
