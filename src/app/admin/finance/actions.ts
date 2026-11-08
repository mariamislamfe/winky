"use server";

import { refresh } from "next/cache";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/config/finance";
import { orderPieces, parseEgp, saleAmount } from "@/lib/finance";
import { requireAdmin } from "@/lib/server/auth";
import { readOrder, updateOrder } from "@/lib/server/orders";
import { addFinanceEntry, readFinanceEntries, removeFinanceEntry, setOutsideSaleOwed } from "@/lib/server/settings";
import { formatPrice } from "@/lib/format";

export type FinanceFormState = { saved?: number; error?: string };

const DAY = /^\d{4}-\d{2}-\d{2}$/;

function pieces(raw: FormDataEntryValue | null) {
  const text = String(raw ?? "").trim();
  if (!text) return 0;
  const n = Number(text);
  return Number.isInteger(n) && n >= 0 && n <= 10000 ? n : null;
}

const day = (raw: FormDataEntryValue | null) => {
  const d = String(raw ?? "");
  return DAY.test(d) ? d : null;
};

export async function addExpense(prev: FinanceFormState, form: FormData): Promise<FinanceFormState> {
  await requireAdmin();
  const category = String(form.get("category") ?? "") as ExpenseCategory;
  if (!EXPENSE_CATEGORIES.some((c) => c.id === category)) return { error: "Choose what it was for." };
  const amount = parseEgp(form.get("amount"));
  if (!amount) return { error: "Enter how much you spent, e.g. 500." };
  const date = day(form.get("date"));
  if (!date) return { error: "Choose the date." };
  await addFinanceEntry({ kind: "expense", category, amount, date, note: String(form.get("note") ?? "").trim().slice(0, 200) });
  refresh();
  return { saved: (prev.saved ?? 0) + 1 };
}

export async function addOutsideSale(prev: FinanceFormState, form: FormData): Promise<FinanceFormState> {
  await requireAdmin();
  const cases = pieces(form.get("cases"));
  const customCases = pieces(form.get("customCases"));
  const extra = parseEgp(form.get("extra"), { optional: true });
  const owed = parseEgp(form.get("owed"), { optional: true });
  if (cases === null || customCases === null) return { error: "Enter the number of cases as a whole number." };
  if (extra === null) return { error: "Enter the other amount in EGP, e.g. 50, or leave it empty." };
  if (owed === null) return { error: "Enter what's still on Zink in EGP, e.g. 50, or leave it empty." };
  if (!cases && !customCases && !extra) return { error: "Add at least one case, or the amount in EGP." };
  const amount = saleAmount({ cases, customCases, extra });
  if (owed > amount) return { error: `Still on Zink can't be more than the order, ${formatPrice(amount)}.` };
  const date = day(form.get("date"));
  if (!date) return { error: "Choose the date." };
  await addFinanceEntry({ kind: "sale", cases, customCases, extra, owed, date, note: String(form.get("note") ?? "").trim().slice(0, 200) });
  refresh();
  return { saved: (prev.saved ?? 0) + 1 };
}

/** Sets how much of a website or outside order Zink still hasn't paid us. */
export async function setOwed(kind: "order" | "sale", id: string, prev: FinanceFormState, form: FormData): Promise<FinanceFormState> {
  await requireAdmin();
  const owed = parseEgp(form.get("owed"), { optional: true });
  if (owed === null) return { error: "Enter an amount in EGP, e.g. 50, or 0." };
  let amount: number;
  if (kind === "order") {
    const order = await readOrder(String(id));
    if (!order) return { error: "This order no longer exists." };
    amount = orderPieces(order).amount;
  } else {
    const entry = (await readFinanceEntries()).find((e) => e.id === String(id));
    if (entry?.kind !== "sale") return { error: "This order no longer exists." };
    amount = saleAmount(entry);
  }
  if (owed > amount) return { error: `Can't be more than the order, ${formatPrice(amount)}.` };
  if (kind === "order") await updateOrder(String(id), { zinkOwed: owed });
  else await setOutsideSaleOwed(String(id), owed);
  refresh();
  return { saved: (prev.saved ?? 0) + 1 };
}

export async function deleteFinanceEntry(id: string) {
  await requireAdmin();
  await removeFinanceEntry(String(id));
  refresh();
}
