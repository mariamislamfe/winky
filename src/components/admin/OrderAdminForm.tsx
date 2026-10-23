"use client";

import { useActionState } from "react";
import { saveOrderAdmin, type OrderUpdateState } from "@/app/admin/orders/actions";
import { DEPOSIT_STATUSES, ORDER_STATUSES } from "@/config/orders";
import type { Order } from "@/lib/types";

export function OrderAdminForm({ order }: { order: Order }) {
  const [state, action, pending] = useActionState<OrderUpdateState, FormData>(saveOrderAdmin.bind(null, order.id), {});
  const field = "mt-1.5 w-full rounded-2xl border-2 border-grape/20 bg-white px-4 outline-none focus:border-grape";
  return (
    <form action={action} className="grid gap-4">
      <fieldset>
        <legend className="font-semibold">InstaPay deposit</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {DEPOSIT_STATUSES.map((s) => (
            <label key={s.id} className="cursor-pointer">
              <input type="radio" name="depositStatus" value={s.id} defaultChecked={order.deposit.status === s.id} className="peer sr-only" />
              <span className="flex h-10 items-center rounded-full px-4 text-sm font-semibold ring-2 ring-grape/15 transition-colors peer-checked:bg-grape peer-checked:text-milk peer-checked:ring-grape peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-grape hover:ring-grape/40">
                {s.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="font-semibold">Order status</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {ORDER_STATUSES.map((s) => (
            <label key={s.id} className="cursor-pointer">
              <input type="radio" name="status" value={s.id} defaultChecked={order.status === s.id} className="peer sr-only" />
              <span className="flex h-10 items-center rounded-full px-4 text-sm font-semibold ring-2 ring-grape/15 transition-colors peer-checked:bg-grape peer-checked:text-milk peer-checked:ring-grape peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-grape hover:ring-grape/40">
                {s.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="zinkRef" className="font-semibold">
          Zink order number
        </label>
        <input id="zinkRef" name="zinkRef" defaultValue={order.zinkRef} placeholder="Paste it here after placing the order on Zink" className={`${field} h-12`} />
      </div>
      <div>
        <label htmlFor="adminNote" className="font-semibold">
          Private note
        </label>
        <textarea id="adminNote" name="adminNote" defaultValue={order.adminNote} rows={3} placeholder="Only you can see this" className={`${field} py-3`} />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
        <p role="status" className={`font-semibold ${state.error ? "text-gum-deep" : ""}`}>
          {state.error ?? (state.saved && !pending ? "Saved." : "")}
        </p>
      </div>
    </form>
  );
}
