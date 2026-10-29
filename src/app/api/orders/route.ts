import { after } from "next/server";
import { notifyNewOrder } from "@/lib/server/notify";
import { createOrder, type CheckoutErrors, type DepositInput } from "@/lib/server/orders";
import type { CartLine, OrderCustomer } from "@/lib/types";

export type PlaceOrderResult =
  | { ok: true; number: string; total: number; shipping: number | null; deposit: number; codBalance: number }
  | { ok: false; errors: CheckoutErrors };

type PlaceOrderInput = {
  customer: Partial<Record<keyof OrderCustomer, string>>;
  lines: CartLine[];
  deposit: DepositInput;
};

/**
 * Places an order: InstaPay deposit + cash on delivery. Everything is checked
 * again on the server (prices, models, designs, the transfer screenshot).
 *
 * A route handler rather than a Server Action on purpose: its URL stays the
 * same across deploys, so a customer who opened checkout before a new
 * version went live can still order.
 */
export async function POST(request: Request) {
  const input = (await request.json().catch(() => null)) as PlaceOrderInput | null;
  if (!input || typeof input !== "object") {
    return Response.json({ ok: false, errors: { form: "Your order didn't arrive. Try again." } } satisfies PlaceOrderResult, { status: 400 });
  }
  const key = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  try {
    const res = await createOrder(input, key);
    if ("errors" in res) return Response.json({ ok: false, errors: res.errors } satisfies PlaceOrderResult);
    const o = res.order;
    // Ping the shop's phone once the customer has their answer
    const origin = process.env.SITE_URL || new URL(request.url).origin;
    after(() => notifyNewOrder(o, origin));
    return Response.json({
      ok: true,
      number: o.number,
      total: o.total,
      shipping: o.shipping,
      deposit: o.deposit.amount,
      codBalance: o.codBalance,
    } satisfies PlaceOrderResult);
  } catch (err) {
    console.error("placeOrder failed", err);
    return Response.json(
      { ok: false, errors: { form: "We couldn't save your order. Try again in a minute, or contact us if it keeps happening." } } satisfies PlaceOrderResult,
      { status: 500 },
    );
  }
}
