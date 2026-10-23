"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteProduct, reorderProduct, togglePublished } from "@/app/admin/actions";

const icon = "grid size-10 place-items-center rounded-full hover:bg-grape/10 disabled:opacity-30";

export function ProductRowActions({
  id,
  name,
  slug,
  published,
  first,
  last,
}: {
  id: string;
  name: string;
  slug: string;
  published: boolean;
  first: boolean;
  last: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      setError(null);
      try {
        await fn();
      } catch {
        setError("That didn't save. Check your connection and try again.");
      }
    });

  return (
    <div className={`flex flex-wrap items-center gap-1 ${pending ? "opacity-60" : ""}`}>
      <button type="button" className={icon} disabled={first || pending} aria-label={`Move ${name} up`} onClick={() => run(() => reorderProduct(id, -1))}>
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5m-6 6 6-6 6 6" />
        </svg>
      </button>
      <button type="button" className={icon} disabled={last || pending} aria-label={`Move ${name} down`} onClick={() => run(() => reorderProduct(id, 1))}>
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14m-6-6 6 6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => togglePublished(id, !published))}
        className="inline-flex min-h-10 items-center rounded-full px-3 text-sm font-semibold ring-2 ring-grape/15 hover:ring-grape/40"
      >
        {published ? "Unpublish" : "Publish"}
      </button>
      {published && (
        <Link href={`/shop/${slug}`} target="_blank" className="inline-flex min-h-10 items-center rounded-full px-3 text-sm font-semibold hover:bg-grape/10">
          View
        </Link>
      )}
      <Link href={`/admin/products/${id}`} className="inline-flex min-h-10 items-center rounded-full bg-grape px-4 text-sm font-semibold text-milk">
        Edit
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (window.confirm(`Delete “${name}”? Its photos are deleted too. This can't be undone.`)) run(() => deleteProduct(id));
        }}
        className="inline-flex min-h-10 items-center rounded-full px-3 text-sm font-semibold text-gum-deep hover:bg-gum/10"
      >
        Delete
      </button>
      {error && (
        <p role="alert" className="basis-full text-sm font-semibold text-gum-deep">
          {error}
        </p>
      )}
    </div>
  );
}
