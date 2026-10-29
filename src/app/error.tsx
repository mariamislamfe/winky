"use client";

import Link from "next/link";
import { useEffect } from "react";
import { WinkMark } from "@/components/brand/WinkMark";

/**
 * Shown instead of the browser-coloured default error screen if a page
 * crashes. The bag lives in the browser, so nothing in it is lost.
 */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="grid min-h-[100svh] place-items-center bg-milk px-5 py-16 text-grape">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <WinkMark className="w-20 text-gum" />
        <h1 className="font-display text-4xl md:text-5xl">Oops, that blinked wrong.</h1>
        <p className="text-lg opacity-80">Something went wrong on our side. Your bag is still saved. Try again, or reload the page.</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn" onClick={() => retry()}>
            Try again <span className="wink-eye" aria-hidden />
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
        <Link href="/" className="mt-2 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
          Back to the homepage
        </Link>
      </div>
    </main>
  );
}
