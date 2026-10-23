"use client";

import { useState } from "react";

/** Copies a value to the clipboard, handy when entering an order on Zink. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch {
          /* clipboard blocked: the text is still selectable */
        }
      }}
      className="shrink-0 rounded-full px-3 py-1 text-xs font-bold ring-2 ring-grape/15 hover:ring-grape/40"
      aria-label={`Copy ${label}`}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
