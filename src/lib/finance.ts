import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/config/finance";
import { CASE_PRICE, PRICING } from "@/config/pricing";
import type { Order } from "@/lib/types";

/** Money in minor units; dates as YYYY-MM-DD in Egypt time. */
export type Expense = { id: string; kind: "expense"; date: string; category: ExpenseCategory; amount: number; note: string };
/**
 * An order that didn't come through the website (Instagram, friends…).
 * `extra` is its delivery fee and any other amount it sold for; `owed` is what Zink still hasn't paid for it.
 */
export type OutsideSale = {
  id: string;
  kind: "sale";
  date: string;
  note: string;
  cases: number;
  customCases: number;
  extra: number;
  owed?: number;
};
export type FinanceEntry = Expense | OutsideSale;
export type NewFinanceEntry = Omit<Expense, "id"> | Omit<OutsideSale, "id">;

export const ALL_TIME = "all";

/** Prices outside orders are counted at: EGP 120 a case, EGP 150 a custom case. */
export const OUTSIDE_PRICE = { case: CASE_PRICE, customCase: PRICING.customBase.case + PRICING.customizationFee.case } as const;

/** YYYY-MM-DD for a moment, in Egypt time. */
export const cairoDay = (d: Date | string) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });

export const monthOf = (day: string) => day.slice(0, 7);

export const monthLabel = (month: string) =>
  new Date(`${month}-01T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

/** EGP typed in a box ("1,250" or "99.5") → minor units; empty → 0 when optional; null if it isn't a sensible amount. */
export function parseEgp(raw: unknown, { optional = false } = {}) {
  const text = String(raw ?? "").replace(/,/g, "").trim();
  if (!text) return optional ? 0 : null;
  const n = Number(text);
  return Number.isFinite(n) && n >= 0 && n <= 10_000_000 ? Math.round(n * 100) : null;
}

/** What a website order sold for: its total, items plus delivery (a fee not set yet counts as 0). */
export function orderPieces(order: Order) {
  let cases = 0;
  let customCases = 0;
  for (const l of order.lines) {
    if (l.category === "case" && l.custom) customCases += l.quantity;
    else if (l.category === "case") cases += l.quantity;
  }
  return { cases, customCases, amount: order.total, owed: Math.min(order.zinkOwed ?? 0, order.total) };
}

export const saleAmount = (s: Pick<OutsideSale, "cases" | "customCases" | "extra">) =>
  s.cases * OUTSIDE_PRICE.case + s.customCases * OUTSIDE_PRICE.customCase + s.extra;

export type LedgerRow =
  | { kind: "order"; date: string; order: Order; cases: number; customCases: number; amount: number; owed: number }
  | { kind: "sale"; date: string; entry: OutsideSale; amount: number; owed: number }
  | { kind: "expense"; date: string; entry: Expense };

/**
 * Totals for a month (or all time): website orders count unless cancelled,
 * outside orders and expenses are the ones added on the finance page.
 * Net profit is sales minus expenses; money still on Zink is part of sales
 * but hasn't reached us yet.
 */
export function summarize(orders: Order[], entries: FinanceEntry[], month: string) {
  const inPeriod = (day: string) => month === ALL_TIME || monthOf(day) === month;
  const rows: LedgerRow[] = [];
  for (const o of orders) {
    const date = cairoDay(o.createdAt);
    if (o.status === "cancelled" || !inPeriod(date)) continue;
    rows.push({ kind: "order", date, order: o, ...orderPieces(o) });
  }
  for (const e of entries) {
    if (!inPeriod(e.date)) continue;
    if (e.kind === "expense") rows.push({ kind: "expense", date: e.date, entry: e });
    else {
      const amount = saleAmount(e);
      rows.push({ kind: "sale", date: e.date, entry: e, amount, owed: Math.min(e.owed ?? 0, amount) });
    }
  }
  rows.sort((a, b) => b.date.localeCompare(a.date));

  const t = { websiteOrders: 0, outsideOrders: 0, cases: 0, customCases: 0, sales: 0, owed: 0, expenses: 0 };
  const byCategory = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.id, 0])) as Record<ExpenseCategory, number>;
  for (const r of rows) {
    if (r.kind === "expense") {
      t.expenses += r.entry.amount;
      byCategory[r.entry.category] += r.entry.amount;
    } else {
      if (r.kind === "order") t.websiteOrders++;
      else t.outsideOrders++;
      const p = r.kind === "order" ? r : r.entry;
      t.cases += p.cases;
      t.customCases += p.customCases;
      t.sales += r.amount;
      t.owed += r.owed;
    }
  }
  return {
    rows,
    totals: { ...t, collected: t.sales - t.owed, net: t.sales - t.expenses, inHand: t.sales - t.owed - t.expenses },
    byCategory,
  };
}

/** Months that have anything in them, newest first, always including this month. */
export function activeMonths(orders: Order[], entries: FinanceEntry[]) {
  const months = new Set([monthOf(cairoDay(new Date()))]);
  for (const o of orders) months.add(monthOf(cairoDay(o.createdAt)));
  for (const e of entries) months.add(monthOf(e.date));
  return [...months].sort().reverse();
}
