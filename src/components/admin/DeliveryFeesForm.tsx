"use client";

import { useActionState, useRef, useState } from "react";
import { saveDeliveryFees, type DeliveryState } from "@/app/admin/actions";
import { GOVERNORATES, type DeliveryFees } from "@/config/orders";

const egp = (piasters: number | undefined) => (piasters == null ? "" : String(piasters / 100));

export function DeliveryFeesForm({ fees }: { fees: DeliveryFees }) {
  const [state, action, saving] = useActionState<DeliveryState, FormData>(saveDeliveryFees, {});
  // "Saved." shows after each save and hides again once a box is edited
  const [edited, setEdited] = useState(false);
  const [shown, setShown] = useState(state);
  if (shown !== state) {
    setShown(state);
    setEdited(false);
  }
  const [all, setAll] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const input =
    "h-12 w-28 rounded-2xl border-2 border-grape/20 bg-white px-4 text-right text-lg tabular-nums outline-none focus:border-grape";

  return (
    <form ref={formRef} action={action} onInput={() => setEdited(true)} className="grid gap-6">
      <section className="rounded-[28px] bg-white p-5 ring-2 ring-grape/10 md:p-6">
        <h2 className="font-display text-2xl">Same fee everywhere?</h2>
        <p className="mt-1 text-sm opacity-70">Fill every governorate at once, then change the ones that differ.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label htmlFor="fee-all" className="sr-only">
            Fee for every governorate (EGP)
          </label>
          <input id="fee-all" inputMode="decimal" value={all} onChange={(e) => setAll(e.target.value)} placeholder="60" className={input} />
          <span className="font-semibold">EGP</span>
          <button
            type="button"
            className="min-h-11 rounded-full px-4 font-semibold ring-2 ring-grape/20 hover:ring-grape/50"
            onClick={() => {
              formRef.current?.querySelectorAll<HTMLInputElement>("input[data-fee]").forEach((el) => (el.value = all.trim()));
              setEdited(true);
            }}
          >
            Fill all
          </button>
        </div>
      </section>

      <section className="rounded-[28px] bg-white p-5 ring-2 ring-grape/10 md:p-6">
        <h2 className="font-display text-2xl">By governorate</h2>
        <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {GOVERNORATES.map((g) => (
            <li key={g} className="flex items-center justify-between gap-3">
              <label htmlFor={`fee-${g}`} className="font-medium">
                {g}
              </label>
              <span className="flex items-center gap-2">
                <input id={`fee-${g}`} name={g} data-fee inputMode="decimal" defaultValue={egp(fees[g])} placeholder="—" className={input} />
                <span className="text-sm font-semibold opacity-70">EGP</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center gap-3 border-t-2 border-grape/10 bg-milk/95 px-5 py-4 backdrop-blur-sm">
        <button type="submit" className="btn" disabled={saving}>
          {saving ? "Saving…" : "Save delivery fees"}
        </button>
        {state.error && (
          <p role="alert" className="font-semibold text-gum-deep">
            {state.error}
          </p>
        )}
        {state.saved && !edited && (
          <p role="status" className="font-semibold">
            Saved. Checkout uses the new fees now.
          </p>
        )}
      </div>
    </form>
  );
}
