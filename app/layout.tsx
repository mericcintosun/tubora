import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import Link from "next/link";
import { ScrollProvider } from "@/components/scroll-provider";
import { SiteHeader } from "@/components/site-header";
import { NavLink } from "@/components/ui/nav-link";
import "./globals.css";

const fredoka = Fredoka({ subsets: ["latin"], display: "swap", variable: "--font-fredoka" });
const nunito = Nunito({ subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-nunito" });

const TITLE = "Tubora: four tubes, no wasted paint";
// Under 160 characters.
const DESCRIPTION =
  "Tick the paints you own. Tubora picks the tubes to pack for one picture, gives every recipe and shows in red what they can't reach.";

export const metadata: Metadata = {
  metadataBase: new URL("https://tubora.vercel.app"),
  title: { default: TITLE, template: "%s | Tubora" },
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, siteName: "Tubora", type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
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
              <nav className="flex flex-wrap gap-2" aria-label="Footer">
                <NavLink href="/">Home</NavLink>
                <NavLink href="/pack?scene=marmara-dusk">Workspace</NavLink>
                <NavLink href="/how">Method</NavLink>
              </nav>
            </div>
            <section aria-labelledby="footer-security" className="mx-auto max-w-6xl px-4 text-sm">
              <h2 id="footer-security" className="font-display text-lg font-semibold">
                About and security
              </h2>
              <p className="mt-1 max-w-[65ch]">
                No wallet, no account, nothing stored on a server. Photos and phrases stay in your browser. Read the{" "}
                <a
                  href="https://github.com/mericcintosun/tubora"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline decoration-2 underline-offset-4"
                >
                  source on GitHub
                </a>{" "}
                or{" "}
                <Link href="/how" className="font-bold underline decoration-2 underline-offset-4">
                  how it works
                </Link>
                .
              </p>
            </section>
          </footer>
        </ScrollProvider>
      </body>
    </html>
  );
}
