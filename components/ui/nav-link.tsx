"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A pill link that marks itself with aria-current="page" when its path matches the current
 * route. The query string is ignored on purpose: only the pathname is read.
 */
function NavLink({
  href,
  className,
  activeClassName,
  children,
}: {
  href: string;
  className?: string;
  activeClassName?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const target = href.split("?")[0].split("#")[0] || "/";
  const active = pathname === target;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full border-2 border-transparent px-3 py-1.5 font-bold underline-offset-4 hover:bg-muted hover:underline",
        active && "border-border bg-muted",
        active && activeClassName,
        className
      )}
    >
      {children}
    </Link>
  );
}

export { NavLink };
