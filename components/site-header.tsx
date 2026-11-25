import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { MobileNav } from "@/components/mobile-nav";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/ui/nav-link";

const LINKS = [
  { href: "/pack/marmara-dusk-four-tubes", label: "A shared palette" },
  { href: "/how", label: "How it works" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-display text-2xl font-semibold">
          <BrandMark size={32} />
          Tubora
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3" aria-label="Main">
          {LINKS.map((l) => (
            <NavLink key={l.href} href={l.href} className="hidden text-sm md:inline-block">
              {l.label}
            </NavLink>
          ))}
          {/* Below sm the CTA lives in the mobile menu, so the brand, CTA and button never crowd 360px. */}
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/pack?scene=marmara-dusk">Pack my tubes</Link>
          </Button>
          <MobileNav />
        </nav>
      </div>
    </header>
  );
}
