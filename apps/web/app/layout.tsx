import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Serif, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { OverlayProvider } from "../components/overlay.js";
import { Felt } from "../components/shell/felt.js";
import { Rail } from "../components/shell/rail.js";
import { BottomBar } from "../components/shell/bottom-bar.js";
import { PlayerProvider } from "../components/shell/player.js";
import { FirstRun } from "../components/onboarding/first-run.js";
import { SeatedCard } from "../components/onboarding/seated-card.js";

// The four faces of the Matchday design, and only those: Bricolage for display (opsz on
// so the 96px masthead and the 9px pips draw from the same family), Instrument Serif for
// the italic accents, Space Grotesk for body, JetBrains Mono for every uppercase label.
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], axes: ["opsz"], variable: "--font-bricolage" });
const instrumentSerif = Instrument_Serif({ weight: "400", style: ["normal", "italic"], subsets: ["latin"], variable: "--font-instrument-serif" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

// viewport-fit=cover so env(safe-area-inset-*) is real on notched phones.
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0e1a14" };

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3200"),
  title: "Proof League",
  description: "A free-points league where real on-chain events are the cards and Creditcoin proof is the referee.",
};

// The shell IS the table (design frame A/B): one felt under everything, the brass rail on
// top of it, the page in the middle, the bottom bar on phones. The felt's room glow
// follows whichever card is held, which is why it is a client wrapper and not a div.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bricolage.variable} ${instrumentSerif.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
        <OverlayProvider>
          <PlayerProvider>
            <Felt>
              <Rail />
              <main className="flex min-h-0 flex-1 flex-col pb-20 md:pb-0">{children}</main>
              <BottomBar />
              <FirstRun />
              <SeatedCard />
            </Felt>
          </PlayerProvider>
        </OverlayProvider>
      </body>
    </html>
  );
}
