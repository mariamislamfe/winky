"use client";

import { useActionState, useState, useTransition } from "react";
import { addExpense, addOutsideSale, deleteFinanceEntry, setOwed, type FinanceFormState } from "@/app/admin/finance/actions";
import { EXPENSE_CATEGORIES } from "@/config/finance";
import { OUTSIDE_PRICE, parseEgp, saleAmount } from "@/lib/finance";
import { formatPrice } from "@/lib/format";

const field = "mt-1.5 h-12 w-full min-w-0 rounded-2xl border-2 border-grape/20 bg-white px-4 outline-none focus:border-grape";
const label = "text-sm font-semibold";

function Status({ state, pending, what }: { state: FinanceFormState; pending: boolean; what: string }) {
  if (state.error)
    return (
      <p role="alert" className="text-sm font-semibold text-gum-deep">
        {state.error}
      </p>
    );
  if (state.saved && !pending)
    return (
      <p role="status" className="text-sm font-semibold">
        {what} added.
      </p>
    );
  return null;
}

export function ExpenseForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState<FinanceFormState, FormData>(addExpense, {});
  return (
    // keyed on the save count so the boxes empty after each save
    <form key={state.saved ?? 0} action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor="ex-category" className={label}>
          For
        </label>
        <select id="ex-category" name="category" defaultValue="zink" className={field}>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="ex-amount" className={label}>
          Amount (EGP)
        </label>
        <input id="ex-amount" name="amount" inputMode="decimal" required placeholder="500" className={field} />
      </div>
      <div>
        <label htmlFor="ex-date" className={label}>
          Date
        </label>
        <input id="ex-date" name="date" type="date" defaultValue={today} max={today} required className={field} />
      </div>
      <div>
        <label htmlFor="ex-note" className={label}>
          Note <span className="font-normal opacity-60">(optional)</span>
        </label>
        <input id="ex-note" name="note" maxLength={200} placeholder="Instagram ads, week 1" className={field} />
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Adding…" : "Add expense"}
        </button>
        <Status state={state} pending={pending} what="Expense" />
      </div>
    </form>
  );
}

export function OutsideSaleForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState<FinanceFormState, FormData>(addOutsideSale, {});
  return <SaleFields key={state.saved ?? 0} today={today} action={action} state={state} pending={pending} />;
}

function SaleFields({
  today,
  action,
  state,
  pending,
}: {
  today: string;
  action: (form: FormData) => void;
  state: FinanceFormState;
  pending: boolean;
}) {
  const [v, setV] = useState({ cases: "", customCases: "", extra: "" });
  const whole = (s: string) => Math.max(0, Math.floor(Number(s) || 0));
  const amount = saleAmount({ cases: whole(v.cases), customCases: whole(v.customCases), extra: parseEgp(v.extra, { optional: true }) ?? 0 });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });

  return (
    <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor="sale-cases" className={label}>
          Cases <span className="font-normal opacity-60">({formatPrice(OUTSIDE_PRICE.case)} each)</span>
        </label>
        <input id="sale-cases" name="cases" inputMode="numeric" value={v.cases} onChange={set("cases")} placeholder="0" className={field} />
      </div>
      <div>
        <label htmlFor="sale-custom" className={label}>
          Custom cases <span className="font-normal opacity-60">({formatPrice(OUTSIDE_PRICE.customCase)} each)</span>
        </label>
        <input
          id="sale-custom"
          name="customCases"
          inputMode="numeric"
          value={v.customCases}
          onChange={set("customCases")}
          placeholder="0"
          className={field}
        />
      </div>
      <div>
        <label htmlFor="sale-extra" className={label}>
          Other amount (EGP) <span className="font-normal opacity-60">(optional)</span>
        </label>
        <input id="sale-extra" name="extra" inputMode="decimal" value={v.extra} onChange={set("extra")} placeholder="0" className={field} />
      </div>
      <div>
        <label htmlFor="sale-owed" className={label}>
          Still on Zink (EGP) <span className="font-normal opacity-60">(optional)</span>
        </label>
        <input id="sale-owed" name="owed" inputMode="decimal" placeholder="0" className={field} />
      </div>
      <div>
        <label htmlFor="sale-date" className={label}>
          Date
        </label>
        <input id="sale-date" name="date" type="date" defaultValue={today} max={today} required className={field} />
      </div>
      <div>
        <label htmlFor="sale-note" className={label}>
          Note <span className="font-normal opacity-60">(optional)</span>
        </label>
        <input id="sale-note" name="note" maxLength={200} placeholder="Sara, from Instagram" className={field} />
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Adding…" : `Add order${amount ? `, ${formatPrice(amount)}` : ""}`}
        </button>
        <Status state={state} pending={pending} what="Order" />
      </div>
    </form>
  );
}

/**
 * "EGP 50 still on Zink" under an order on the finance page: money it sold
 * for that Zink hasn't paid us yet. Opens a small box to change it.
 */
export function OwedEditor({ kind, id, owed }: { kind: "order" | "sale"; id: string; owed: number }) {
  const [state, action, pending] = useActionState<FinanceFormState, FormData>(setOwed.bind(null, kind, id), {});
  const [open, setOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState(state.saved);
  // close the box once a save goes through
  if (state.saved !== lastSaved) {
    setLastSaved(state.saved);
    setOpen(false);
  }

  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`mt-1 inline-flex min-h-8 items-center rounded-full px-3 text-xs font-bold ring-2 hover:ring-grape/40 ${owed ? "bg-butter ring-butter" : "ring-grape/15 opacity-70"}`}
      >
        {owed ? `${formatPrice(owed)} still on Zink` : "All collected · set still on Zink"}
      </button>
    );

  return (
    <form action={action} className="mt-2 flex flex-wrap items-center gap-2">
      <label htmlFor={`owed-${id}`} className="text-sm font-semibold">
        Still on Zink (EGP)
      </label>
      <input
        id={`owed-${id}`}
        name="owed"
        inputMode="decimal"
        defaultValue={owed ? owed / 100 : ""}
        placeholder="0"
        autoFocus
        className="h-10 w-24 rounded-xl border-2 border-grape/20 bg-white px-3 outline-none focus:border-grape"
      />
      <button type="submit" className="h-10 rounded-full bg-grape px-4 text-sm font-semibold text-milk disabled:opacity-45" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="h-10 px-2 text-sm font-semibold underline underline-offset-4">
        Cancel
      </button>
      {state.error && (
        <p role="alert" className="w-full text-sm font-semibold text-gum-deep">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function DeleteEntryButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [failed, setFailed] = useState(false);
  const name = failed ? "Not deleted, try again" : "Delete entry";
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Delete this entry? This can't be undone.")) return;
        start(async () => {
          setFailed(false);
          try {
            await deleteFinanceEntry(id);
          } catch {
            setFailed(true);
          }
        });
      }}
      aria-label={name}
      title={name}
      className={`grid size-10 shrink-0 place-items-center rounded-full hover:bg-gum/10 disabled:opacity-40 ${failed ? "text-gum-deep ring-2 ring-gum" : ""}`}
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
        <path d="M5 7h14M10 7V5h4v2m-7 0 1 12h8l1-12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
