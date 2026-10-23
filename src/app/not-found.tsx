import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[100svh] place-items-center bg-gum px-5 pt-[var(--header-h)] text-center text-grape">
      <div>
        <svg viewBox="0 0 120 50" className="mx-auto w-48" aria-hidden>
          <path d="M8 14 Q30 40 52 14" stroke="currentColor" strokeWidth="9" strokeLinecap="round" fill="none" />
          <path d="M68 14 Q90 40 112 14" stroke="currentColor" strokeWidth="9" strokeLinecap="round" fill="none" />
        </svg>
        <h1 className="font-display mt-6 text-[clamp(3rem,9vw,6rem)] leading-[0.9]">This page blinked out.</h1>
        <p className="mx-auto mt-4 max-w-[36ch] text-lg font-medium">
          The link might be old, or the page moved. Everything that winks is still in the shop.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn">
            Shop the collection <span className="wink-eye" aria-hidden />
          </Link>
          <Link href="/" className="btn btn-ghost">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
