"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { OTHER_MODEL, OTHER_MODEL_PREFIX, PHONE_MODEL_GROUPS } from "@/config/catalog";
import { modelLabel, searchModels } from "@/lib/models";

const NOT_LISTED = "\u0000not-listed";
const brandOf = new Map(PHONE_MODEL_GROUPS.flatMap((g) => g.models.map((m) => [m, g.brand] as const)));

/**
 * Phone model chooser for long model lists: type a couple of characters
 * ("a54", "16 pro", "reno 5") and pick from the matches, or type the model
 * yourself when it isn't listed (saved as "Other: …").
 */
export function ModelPicker({
  models,
  value,
  onChange,
  invalid,
}: {
  models: readonly string[];
  value: string;
  onChange: (model: string) => void;
  invalid?: boolean;
}) {
  const id = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [typed, setTyped] = useState<string | null>(null);

  const results = useMemo(() => searchModels(models, query), [models, query]);
  // Without a search the list is shown by brand; the option order follows what's on screen
  const sections = useMemo(() => {
    if (query.trim()) return [{ brand: "", items: results }];
    const order = [...new Set([...PHONE_MODEL_GROUPS.map((g) => g.brand), "More"])];
    return order
      .map((brand) => ({ brand, items: results.filter((m) => (brandOf.get(m) ?? "More") === brand) }))
      .filter((s) => s.items.length);
  }, [query, results]);
  const options = [...sections.flatMap((s) => s.items), NOT_LISTED];

  const choose = (option: string) => {
    if (option === NOT_LISTED) {
      setTyped(query.trim());
      return;
    }
    onChange(option);
  };

  const reopen = () => {
    onChange("");
    setQuery("");
    setTyped(null);
    setActive(0);
    requestAnimationFrame(() => searchRef.current?.focus());
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(options.length - 1, Math.max(0, active + (e.key === "ArrowDown" ? 1 : -1)));
      setActive(next);
      listRef.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(options[active]);
    } else if (e.key === "Escape" && query) {
      e.preventDefault();
      setQuery("");
      setActive(0);
    }
  };

  if (value) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="flex min-h-11 items-center gap-2 rounded-full bg-grape px-4 font-semibold text-milk">
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
            <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {modelLabel(value)}
        </span>
        <button type="button" onClick={reopen} className="min-h-11 rounded-full px-4 font-semibold ring-2 ring-grape/20 hover:ring-grape/50">
          Change
        </button>
      </div>
    );
  }

  const field =
    "h-13 w-full min-w-0 rounded-2xl border-2 border-grape/20 bg-white px-4 text-lg outline-none focus:border-grape aria-invalid:border-gum-deep";

  if (typed !== null) {
    const candidate = OTHER_MODEL_PREFIX + typed.trim().replace(/\s+/g, " ");
    const ok = OTHER_MODEL.test(candidate);
    const submit = () => ok && onChange(candidate);
    return (
      <div className="mt-3">
        <label htmlFor={`${id}-typed`} className="text-sm font-semibold">
          Type your phone model
        </label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          <input
            id={`${id}-typed`}
            autoFocus
            value={typed}
            maxLength={40}
            autoComplete="off"
            placeholder="e.g. Nokia G21"
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            aria-invalid={invalid}
            className={`${field} flex-1 basis-56`}
          />
          <button type="button" className="btn min-h-13" disabled={!ok} onClick={submit}>
            Use this model
          </button>
        </div>
        <p className="mt-1.5 text-sm opacity-75">We&apos;ll confirm it fits when we call you about the order.</p>
        <button type="button" onClick={() => setTyped(null)} className="mt-1 min-h-11 text-sm font-semibold underline underline-offset-4">
          Back to the list
        </button>
      </div>
    );
  }

  let index = -1;
  const option = (m: string) => {
    index++;
    const i = index;
    const notListed = m === NOT_LISTED;
    return (
      <li
        key={m}
        id={`${id}-opt-${i}`}
        data-index={i}
        role="option"
        aria-selected={i === active}
        onMouseDown={(e) => e.preventDefault()}
        onMouseMove={() => i !== active && setActive(i)}
        onClick={() => choose(m)}
        className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-1.5 aria-selected:bg-grape/10 ${notListed ? "mt-1 border-t-2 border-grape/10 font-semibold" : ""}`}
      >
        {notListed ? (
          <span>
            My phone isn&apos;t listed{query.trim() ? `: use “${query.trim()}”` : ""}
          </span>
        ) : (
          <>
            <span>{m}</span>
            {query.trim() && brandOf.get(m) && (
              <span aria-hidden className="shrink-0 text-xs opacity-60">
                {brandOf.get(m)}
              </span>
            )}
          </>
        )}
      </li>
    );
  };

  return (
    <div className="mt-3">
      <label htmlFor={`${id}-search`} className="sr-only">
        Search for your phone model
      </label>
      <input
        id={`${id}-search`}
        ref={searchRef}
        type="search"
        role="combobox"
        aria-expanded="true"
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={`${id}-opt-${active}`}
        aria-invalid={invalid}
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          listRef.current?.scrollTo({ top: 0 });
        }}
        onKeyDown={onKeyDown}
        onFocus={(e) => {
          // On phones, lift the search to the top once the keyboard is up so the results fit under it
          const el = e.currentTarget;
          if (matchMedia("(max-width: 1023px)").matches) setTimeout(() => el.scrollIntoView({ block: "start", behavior: "smooth" }), 300);
        }}
        placeholder="Type your phone, e.g. A54 or iPhone 15"
        className={field}
      />
      <ul
        id={`${id}-list`}
        ref={listRef}
        role="listbox"
        aria-label="Phone models"
        className="mt-2 max-h-72 overflow-y-auto overscroll-contain rounded-2xl bg-white p-1.5 ring-2 ring-grape/10"
      >
        {sections.map((s) =>
          s.brand ? (
            <li key={s.brand} role="presentation">
              <p className="sticky top-0 z-10 bg-white px-3 pt-2 pb-1 text-xs font-bold tracking-wide uppercase opacity-60">{s.brand}</p>
              <ul role="presentation">{s.items.map(option)}</ul>
            </li>
          ) : (
            s.items.map(option)
          ),
        )}
        {!results.length && (
          <li role="presentation" className="px-3 py-2 text-sm opacity-75">
            No model matches “{query.trim()}”.
          </li>
        )}
        {option(NOT_LISTED)}
      </ul>
    </div>
  );
}
