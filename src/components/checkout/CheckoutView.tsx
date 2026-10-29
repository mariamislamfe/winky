"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, useTransition, type FormEvent } from "react";
import type { PlaceOrderResult } from "@/app/api/orders/route";
import { WinkMark } from "@/components/brand/WinkMark";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { GOVERNORATES, type DeliveryFees, type Governorate } from "@/config/orders";
import { depositFor, INSTAPAY, instapayReady } from "@/config/payments";
import { InstapayDeposit } from "./InstapayDeposit";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { CartLine, OrderCustomer } from "@/lib/types";

type Field = {
  name: keyof OrderCustomer;
  label: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "tel" | "email" | "text";
  wide?: boolean;
  optional?: boolean;
  hint?: string;
};

const FIELDS: Field[] = [
  { name: "name", label: "Full name", autoComplete: "name", wide: true },
  { name: "phone", label: "Mobile number", type: "tel", inputMode: "tel", autoComplete: "tel", hint: "We call this number to confirm your order." },
  { name: "email", label: "Email", type: "email", inputMode: "email", autoComplete: "email", optional: true },
  { name: "governorate", label: "Governorate" },
  { name: "city", label: "City or area", autoComplete: "address-level2" },
  { name: "address", label: "Street address", autoComplete: "street-address", wide: true, hint: "Street, building number, floor and apartment." },
  { name: "notes", label: "Notes for delivery", wide: true, optional: true },
];

/**
 * Sends the order. Never throws: a dropped connection or a server problem
 * comes back as a message on the form, and the bag stays as it is.
 */
async function placeOrder(input: { customer: Record<string, string>; lines: CartLine[]; deposit: Record<string, string> }): Promise<PlaceOrderResult> {
  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = (await res.json().catch(() => null)) as PlaceOrderResult | null;
    if (json && typeof json.ok === "boolean") return json;
    throw new Error(`HTTP ${res.status}`);
  } catch {
    return {
      ok: false,
      errors: { form: "Your order didn't go through. Check your connection and press Place order again; your bag is still saved." },
    };
  }
}

/** Image previews (data URLs) stay in the browser; the server uses the uploaded originals. */
const forServer = (lines: CartLine[]): CartLine[] =>
  lines.map((l) =>
    l.custom
      ? {
          ...l,
          custom: {
            ...l.custom,
            layers: l.custom.layers.map((layer) => (layer.kind === "image" ? { ...layer, src: "" } : layer)),
          },
        }
      : l,
  );

export function CheckoutView({ deliveryFees }: { deliveryFees: DeliveryFees }) {
  const { lines, subtotal, count, hydrated, clear } = useCart();
  const reduce = useReducedMotion();
  const [errors, setErrors] = useState<Extract<PlaceOrderResult, { ok: false }>["errors"]>({});
  const [done, setDone] = useState<Extract<PlaceOrderResult, { ok: true }> | null>(null);
  const [pending, start] = useTransition();
  const [governorate, setGovernorate] = useState("");
  // undefined = no governorate chosen yet, null = fee confirmed on the phone
  const fee = governorate ? (deliveryFees[governorate as Governorate] ?? null) : undefined;
  const total = subtotal == null ? null : subtotal + (fee ?? 0);
  const deposit = total == null ? null : depositFor(total, count);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { payer, reference, receiptFileId, ...customer } = Object.fromEntries(new FormData(e.currentTarget)) as Record<
      keyof OrderCustomer | "payer" | "reference" | "receiptFileId",
      string
    >;
    start(async () => {
      const result = await placeOrder({ customer, lines: forServer(lines), deposit: { payer, reference, receiptFileId } });
      if (result.ok) {
        setDone(result);
        setErrors({});
        clear();
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      } else {
        setErrors(result.errors);
        const first = [...FIELDS.map((f) => f.name), "payer", "receipt"].find((k) => result.errors[k as keyof typeof result.errors]);
        if (first) document.getElementById(`co-${first}`)?.focus();
      }
    });
  };

  if (done) {
    return (
      <motion.div
        role="status"
        initial={reduce ? false : { opacity: 0, y: 20, rotate: -1 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-[36px] bg-white p-8 text-center ring-2 ring-grape/10 md:p-12"
      >
        <WinkMark className="w-24 text-gum" />
        <h2 className="font-display text-4xl md:text-5xl">Order received!</h2>
        <p className="text-lg">
          Your order number is <strong className="tabular-nums">{done.number}</strong>.
        </p>
        <p className="max-w-[42ch] opacity-80">
          We&apos;ll check your {formatPrice(done.deposit)} InstaPay deposit and call you to confirm before we send it to print.
          {done.shipping == null ? " We'll confirm the delivery fee on the call." : ""}
        </p>
        <dl className="grid w-full max-w-xs gap-1 text-left">
          <div className="flex justify-between gap-3">
            <dt>Deposit (InstaPay)</dt>
            <dd className="tabular-nums">{formatPrice(done.deposit)}</dd>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <dt>Cash on delivery</dt>
            <dd className="tabular-nums">
              {formatPrice(done.codBalance)}
              {done.shipping == null && <span className="ml-1 text-sm font-medium opacity-70">+ delivery</span>}
            </dd>
          </div>
        </dl>
        <Link href="/shop" className="btn mt-2">
          Keep shopping <span className="wink-eye" aria-hidden />
        </Link>
      </motion.div>
    );
  }

  if (!hydrated) {
    return (
      <div className="grid h-[40vh] place-items-center" role="status">
        <WinkMark className="w-16 animate-pulse text-gum" title="Loading your bag" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 py-20 text-center">
        <WinkMark className="w-24 text-gum" />
        <h2 className="font-display text-4xl">Your bag is empty</h2>
        <p className="max-w-[36ch] opacity-75">Add something from the shop and come back here to check out.</p>
        <Link href="/shop" className="btn">
          Shop the collection <span className="wink-eye" aria-hidden />
        </Link>
      </div>
    );
  }

  const input =
    "mt-1.5 h-13 w-full rounded-2xl border-2 border-grape/20 bg-white px-4 text-lg outline-none focus:border-grape aria-invalid:border-gum-deep";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-16">
      <form
        onSubmit={onSubmit}
        noValidate
        aria-labelledby="contact-title"
        onInput={(e) => {
          // A field's error disappears as soon as the customer edits it
          const name = (e.target as HTMLInputElement).name;
          const key = name === "receiptFileId" ? "receipt" : name;
          if (key && errors[key as keyof typeof errors]) setErrors((prev) => ({ ...prev, [key]: undefined }));
        }}
      >
        <h2 id="contact-title" className="font-display text-3xl">
          Delivery details
        </h2>
        <p className="mt-1 opacity-75">Delivery anywhere in Egypt. A small InstaPay deposit confirms your order, the rest is cash on delivery.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => {
            const id = `co-${f.name}`;
            const err = errors[f.name];
            const describedBy = [f.hint ? `${id}-hint` : "", err ? `${id}-err` : ""].filter(Boolean).join(" ") || undefined;
            return (
              <div key={f.name} className={f.wide ? "sm:col-span-2" : ""}>
                <label htmlFor={id} className="font-semibold">
                  {f.label} {f.optional && <span className="font-normal opacity-60">(optional)</span>}
                </label>
                {f.name === "governorate" ? (
                  <select
                    id={id}
                    name={f.name}
                    value={governorate}
                    onChange={(e) => setGovernorate(e.target.value)}
                    aria-invalid={!!err}
                    aria-describedby={describedBy}
                    className={input}
                  >
                    <option value="" disabled>
                      Choose…
                    </option>
                    {GOVERNORATES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                ) : f.name === "notes" || f.name === "address" ? (
                  <textarea
                    id={id}
                    name={f.name}
                    rows={f.name === "address" ? 2 : 2}
                    autoComplete={f.autoComplete}
                    aria-invalid={!!err}
                    aria-describedby={describedBy}
                    className={`${input} h-auto py-3`}
                  />
                ) : (
                  <input
                    id={id}
                    name={f.name}
                    type={f.type ?? "text"}
                    inputMode={f.inputMode}
                    autoComplete={f.autoComplete}
                    aria-invalid={!!err}
                    aria-describedby={describedBy}
                    className={input}
                  />
                )}
                {f.hint && (
                  <p id={`${id}-hint`} className="mt-1 text-sm opacity-70">
                    {f.hint}
                  </p>
                )}
                {err && (
                  <p id={`${id}-err`} className="mt-1 text-sm font-semibold text-gum-deep">
                    {err}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <InstapayDeposit total={total} items={count} errors={errors} />

        <AnimatePresence>
          {errors.form && (
            <motion.p
              role="alert"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-2xl bg-gum/15 px-5 py-3 font-semibold text-gum-deep"
            >
              {errors.form}
            </motion.p>
          )}
        </AnimatePresence>

        <button type="submit" className="btn mt-8 w-full sm:w-auto" disabled={pending || !instapayReady()}>
          {pending ? "Placing your order…" : "Place order"} <span className="wink-eye" aria-hidden />
        </button>
      </form>

      <aside aria-labelledby="summary-title" className="h-fit rounded-[32px] bg-white p-4 ring-2 sm:p-6 ring-grape/10 lg:sticky lg:top-24">
        <h2 id="summary-title" className="font-display text-3xl">
          Order summary <span className="font-sans text-base font-semibold opacity-60">({count})</span>
        </h2>
        <ul className="mt-2 divide-y-2 divide-grape/10">
          <AnimatePresence initial={false}>
            {lines.map((l) => (
              <CartLineItem key={l.id} line={l} />
            ))}
          </AnimatePresence>
        </ul>
        <dl className="mt-4 grid gap-1 border-t-2 border-grape/10 pt-4">
          <div className="flex justify-between gap-3">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Delivery{governorate ? ` to ${governorate}` : ""}</dt>
            <dd className={`text-right ${fee == null ? "opacity-70" : "tabular-nums"}`}>
              {fee === undefined ? "Choose your governorate" : fee === null ? "Confirmed on the phone" : formatPrice(fee)}
            </dd>
          </div>
          <div className="mt-2 flex justify-between gap-3 text-xl font-bold">
            <dt>{fee == null ? "Total before delivery" : "Total"}</dt>
            <dd className="tabular-nums">{formatPrice(total)}</dd>
          </div>
        </dl>
        {total != null && deposit != null && (
          <dl className="mt-3 grid gap-1 rounded-2xl bg-milk p-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt>
                Deposit now (InstaPay)
                {count > 1 && <span className="opacity-70"> · {formatPrice(INSTAPAY.depositAmount)} × {count}</span>}
              </dt>
              <dd className="font-semibold tabular-nums">{formatPrice(deposit)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Cash on delivery</dt>
              <dd className="text-right font-semibold tabular-nums">
                {formatPrice(total - deposit)}
                {fee == null && " + delivery"}
              </dd>
            </div>
          </dl>
        )}
      </aside>
    </div>
  );
}
