"use client";

import { useActionState, useState, useTransition } from "react";
import { addExpense, addOutsideSale, deleteFinanceEntry, type FinanceFormState } from "@/app/admin/finance/actions";
import { EXPENSE_CATEGORIES } from "@/config/finance";
import { PROFIT_PER_ITEM } from "@/config/pricing";
import { saleProfit } from "@/lib/finance";
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
        <select id="ex-category" name="category" defaultValue="ads" className={field}>
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
  const profit = saleProfit({
    cases: whole(v.cases),
    customCases: whole(v.customCases),
    extra: Math.max(0, Math.round((Number(v.extra.replace(/,/g, "")) || 0) * 100)),
  });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });

  return (
    <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
      <div>
        <label htmlFor="sale-cases" className={label}>
          Cases <span className="font-normal opacity-60">({formatPrice(PROFIT_PER_ITEM.case.regular)} each)</span>
        </label>
        <input id="sale-cases" name="cases" inputMode="numeric" value={v.cases} onChange={set("cases")} placeholder="0" className={field} />
      </div>
      <div>
        <label htmlFor="sale-custom" className={label}>
          Custom cases <span className="font-normal opacity-60">({formatPrice(PROFIT_PER_ITEM.case.custom)} each)</span>
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
          Other profit (EGP) <span className="font-normal opacity-60">(optional)</span>
        </label>
        <input id="sale-extra" name="extra" inputMode="decimal" value={v.extra} onChange={set("extra")} placeholder="0" className={field} />
      </div>
      <div>
        <label htmlFor="sale-date" className={label}>
          Date
        </label>
        <input id="sale-date" name="date" type="date" defaultValue={today} max={today} required className={field} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="sale-note" className={label}>
          Note <span className="font-normal opacity-60">(optional)</span>
        </label>
        <input id="sale-note" name="note" maxLength={200} placeholder="Sara, from Instagram" className={field} />
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Adding…" : `Add order${profit ? `, ${formatPrice(profit)} profit` : ""}`}
        </button>
        <Status state={state} pending={pending} what="Order" />
      </div>
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
