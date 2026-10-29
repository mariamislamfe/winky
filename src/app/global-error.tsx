"use client";

import { useEffect } from "react";

/**
 * Last-resort error screen when even the root layout fails. It renders its
 * own document without the site's CSS, so the styles are inline, and the
 * colours are fixed so a phone in dark mode doesn't get a black screen.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const button = {
    minHeight: 52,
    padding: "0 24px",
    borderRadius: 999,
    fontSize: 17,
    fontWeight: 700,
    cursor: "pointer",
    border: "2px solid #2b1140",
  } as const;

  return (
    <html lang="en" style={{ colorScheme: "light" }}>
      <body style={{ margin: 0, minHeight: "100svh", display: "grid", placeItems: "center", background: "#fff0f5", color: "#2b1140", fontFamily: "system-ui, sans-serif", padding: 20, textAlign: "center" }}>
        <title>WINKY</title>
        <div style={{ maxWidth: 420 }}>
          <svg viewBox="0 0 44 24" width="88" aria-hidden style={{ color: "#ff4f9a" }}>
            <circle cx="10" cy="11" r="8" fill="currentColor" />
            <path d="M26 8 Q34 18 42 8" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" fill="none" />
          </svg>
          <h1 style={{ fontSize: 34, margin: "16px 0 8px" }}>Oops, that blinked wrong.</h1>
          <p style={{ fontSize: 18, opacity: 0.8, margin: "0 0 20px" }}>Something went wrong on our side. Your bag is still saved.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button type="button" onClick={() => retry()} style={{ ...button, background: "#2b1140", color: "#fff0f5" }}>
              Try again
            </button>
            <button type="button" onClick={() => window.location.reload()} style={{ ...button, background: "transparent", color: "#2b1140" }}>
              Reload page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
