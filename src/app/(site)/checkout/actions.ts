"use server";

import { headers } from "next/headers";
import { createOrder, type CheckoutErrors, type DepositInput } from "@/lib/server/orders";
import type { CartLine, OrderCustomer } from "@/lib/types";

export type PlaceOrderResult =
  | { ok: true; number: string; total: number; shipping: number | null; deposit: number; codBalance: number }
  | { ok: false; errors: CheckoutErrors };

/**
 * InstaPay deposit + cash on delivery: validates everything again on the
 * server (prices, designs, the transfer screenshot) and saves the order.
 */
export async function placeOrder(input: {
  customer: Partial<Record<keyof OrderCustomer, string>>;
  lines: CartLine[];
  deposit: DepositInput;
}): Promise<PlaceOrderResult> {
  const h = await headers();
  const key = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  try {
    const res = await createOrder(input, key);
    if ("errors" in res) return { ok: false, errors: res.errors };
    const o = res.order;
    return { ok: true, number: o.number, total: o.total, shipping: o.shipping, deposit: o.deposit.amount, codBalance: o.codBalance };
  } catch {
    return { ok: false, errors: { form: "We couldn't save your order. Check your connection and try again." } };
  }
}
