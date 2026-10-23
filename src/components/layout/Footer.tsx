import Link from "next/link";
import { WinkMark } from "@/components/brand/WinkMark";
import { NAV_LINKS, SITE } from "@/config/site";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-grape text-milk">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 pt-16 pb-10 md:grid-cols-[1.4fr_1fr] md:px-10 md:pt-24">
        <div>
          <p className="font-display text-[clamp(2.4rem,6vw,4.5rem)] leading-[0.95] text-gum">
            Carry something
            <br />
            that winks back.
          </p>
          <WinkMark className="mt-8 w-20 text-butter" />
        </div>
        <nav aria-label="Footer" className="grid content-start gap-1 text-lg font-medium">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="inline-flex min-h-11 w-fit items-center underline-offset-4 hover:text-gum hover:underline">
              {l.label}
            </Link>
          ))}
          <Link href="/checkout" className="inline-flex min-h-11 w-fit items-center underline-offset-4 hover:text-gum hover:underline">
            Checkout
          </Link>
        </nav>
      </div>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 border-t border-milk/15 px-5 py-6 text-sm text-milk/75 md:flex-row md:items-center md:justify-between md:px-10">
        <p>© {SITE.name}</p>
      </div>
      <p
        aria-hidden
        className="font-display pointer-events-none -mb-[0.2em] select-none px-2 text-center text-[27vw] leading-[0.8] text-milk/[0.06]"
      >
        winky
      </p>
    </footer>
  );
}
