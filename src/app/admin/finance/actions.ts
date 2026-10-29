"use server";

import { refresh } from "next/cache";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/config/finance";
import { requireAdmin } from "@/lib/server/auth";
import { addFinanceEntry, removeFinanceEntry } from "@/lib/server/settings";

export type FinanceFormState = { saved?: number; error?: string };

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** EGP typed in a box ("1,250" or "99.5") → minor units, or null if it isn't a sensible amount. */
function egp(raw: FormDataEntryValue | null, { optional = false } = {}) {
  const text = String(raw ?? "").replace(/,/g, "").trim();
  if (!text) return optional ? 0 : null;
  const n = Number(text);
  return Number.isFinite(n) && n >= 0 && n <= 10_000_000 ? Math.round(n * 100) : null;
}

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
  const amount = egp(form.get("amount"));
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
  const extra = egp(form.get("extra"), { optional: true });
  if (cases === null || customCases === null) return { error: "Enter the number of cases as a whole number." };
  if (extra === null) return { error: "Enter the other profit in EGP, e.g. 50, or leave it empty." };
  if (!cases && !customCases && !extra) return { error: "Add at least one case, or the profit in EGP." };
  const date = day(form.get("date"));
  if (!date) return { error: "Choose the date." };
  await addFinanceEntry({ kind: "sale", cases, customCases, extra, date, note: String(form.get("note") ?? "").trim().slice(0, 200) });
  refresh();
  return { saved: (prev.saved ?? 0) + 1 };
}

export async function deleteFinanceEntry(id: string) {
  await requireAdmin();
  await removeFinanceEntry(String(id));
  refresh();
}
