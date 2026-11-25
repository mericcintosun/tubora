import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { ChunkRecovery } from "@/components/chunk-recovery";
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

// Every page is rendered per request by the deployment that serves it. Prerendered HTML was
// cached at the edge with a year-long s-maxage, so after a redeploy the live crawl got /how and
// /pack/[palette] HTML from an older build (copy removed two commits earlier) whose
// /_next/static chunks no longer existed (404). Dynamic HTML is sent as no-store and never
// outlives its build. All pages are cheap to render: the planner works on a 96x64 frame.
export const dynamic = "force-dynamic";

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
      <head>
        <ChunkRecovery />
      </head>
      <body className="min-h-screen antialiased">
        <ScrollProvider>
          <SiteHeader />
          <main>{children}</main>
          <footer className="border-t-2 border-border bg-muted pb-10">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-[65ch]">
                No wallet, no account and nothing stored on a server: photos stay in your browser, and mixes are sRGB
                estimates, so test a small swatch first.
              </p>
              <nav className="flex flex-wrap gap-2" aria-label="Footer">
                <NavLink href="/pack">Workspace</NavLink>
                <NavLink href="/how">Method</NavLink>
                <a
                  href="https://github.com/mericcintosun/tubora"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border-2 border-transparent px-3 py-1.5 font-bold underline underline-offset-4 hover:bg-muted"
                >
                  Source on GitHub
                </a>
                <a
                  href="https://innovart2027.devpost.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border-2 border-transparent px-3 py-1.5 font-bold underline underline-offset-4 hover:bg-muted"
                >
                  InnovArt 2027
                </a>
              </nav>
            </div>
          </footer>
        </ScrollProvider>
      </body>
    </html>
  );
}
