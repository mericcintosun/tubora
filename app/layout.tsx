import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import Link from "next/link";
import { ScrollProvider } from "@/components/scroll-provider";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const fredoka = Fredoka({ subsets: ["latin"], display: "swap", variable: "--font-fredoka" });
const nunito = Nunito({ subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-nunito" });

export const metadata: Metadata = {
  metadataBase: new URL("https://tubora.vercel.app"),
  title: { default: "Tubora: pick the tubes, see what you can't paint", template: "%s · Tubora" },
  description:
    "Drop in a reference photo and tick the paints you own. Tubora picks the best few tubes to carry for that picture, gives a mixing recipe for every color, and lights up the parts those tubes can never reach.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="min-h-screen antialiased">
        <ScrollProvider>
          <SiteHeader />
          <main>{children}</main>
          <footer className="mt-24 border-t-2 border-border bg-muted pb-10">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-[65ch]">
                Tubora estimates mixes from sRGB tube swatches. Real paint drifts: test a small swatch before you commit a
                whole sky.
              </p>
              <nav className="flex gap-4 font-bold" aria-label="Footer">
                <Link href="/pack" className="underline-offset-4 hover:underline">Workspace</Link>
                <Link href="/how" className="underline-offset-4 hover:underline">Method</Link>
              </nav>
            </div>
          </footer>
        </ScrollProvider>
      </body>
    </html>
  );
}
