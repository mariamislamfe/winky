import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/config/finance";
import { PROFIT_PER_ITEM } from "@/config/pricing";
import type { Order } from "@/lib/types";

/** Money in minor units; dates as YYYY-MM-DD in Egypt time. */
export type Expense = { id: string; kind: "expense"; date: string; category: ExpenseCategory; amount: number; note: string };
/** An order that didn't come through the website (Instagram, friends…). */
export type OutsideSale = { id: string; kind: "sale"; date: string; note: string; cases: number; customCases: number; extra: number };
export type FinanceEntry = Expense | OutsideSale;
export type NewFinanceEntry = Omit<Expense, "id"> | Omit<OutsideSale, "id">;

export const ALL_TIME = "all";

/** YYYY-MM-DD for a moment, in Egypt time. */
export const cairoDay = (d: Date | string) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });

export const monthOf = (day: string) => day.slice(0, 7);

export const monthLabel = (month: string) =>
  new Date(`${month}-01T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

export function orderPieces(order: Order) {
  let cases = 0;
  let customCases = 0;
  let profit = 0;
  for (const l of order.lines) {
    if (l.category === "case" && l.custom) customCases += l.quantity;
    else if (l.category === "case") cases += l.quantity;
    profit += l.quantity * PROFIT_PER_ITEM[l.category][l.custom ? "custom" : "regular"];
  }
  return { cases, customCases, profit };
}

export const saleProfit = (s: Pick<OutsideSale, "cases" | "customCases" | "extra">) =>
  s.cases * PROFIT_PER_ITEM.case.regular + s.customCases * PROFIT_PER_ITEM.case.custom + s.extra;

export type LedgerRow =
  | { kind: "order"; date: string; order: Order; cases: number; customCases: number; profit: number }
  | { kind: "sale"; date: string; entry: OutsideSale; profit: number }
  | { kind: "expense"; date: string; entry: Expense };

/**
 * Totals for a month (or all time): website orders count unless cancelled,
 * outside orders and expenses are the ones added on the finance page.
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
    rows.push(e.kind === "sale" ? { kind: "sale", date: e.date, entry: e, profit: saleProfit(e) } : { kind: "expense", date: e.date, entry: e });
  }
  rows.sort((a, b) => b.date.localeCompare(a.date));

  const t = { websiteOrders: 0, outsideOrders: 0, cases: 0, customCases: 0, profit: 0, expenses: 0 };
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
      t.profit += r.profit;
    }
  }
  return { rows, totals: { ...t, net: t.profit - t.expenses }, byCategory };
}

/** Months that have anything in them, newest first, always including this month. */
export function activeMonths(orders: Order[], entries: FinanceEntry[]) {
  const months = new Set([monthOf(cairoDay(new Date()))]);
  for (const o of orders) months.add(monthOf(cairoDay(o.createdAt)));
  for (const e of entries) months.add(monthOf(e.date));
  return [...months].sort().reverse();
}
