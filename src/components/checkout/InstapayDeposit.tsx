"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { depositFor, INSTAPAY, instapayReady } from "@/config/payments";
import { formatPrice } from "@/lib/format";
import { uploadFile } from "@/lib/upload";

function Copy({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch {
          /* selectable anyway */
        }
      }}
      className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-grape px-4 text-sm font-bold text-milk"
      aria-label={`Copy ${label}`}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/**
 * Deposit step of checkout: how to pay by InstaPay, then proof of payment
 * (the name/number paid from + a screenshot of the transfer).
 */
export function InstapayDeposit({
  total,
  items,
  errors,
}: {
  total: number | null;
  /** Pieces in the bag: the deposit is per piece */
  items: number;
  errors: { payer?: string; receipt?: string };
}) {
  const deposit = depositFor(total ?? INSTAPAY.depositAmount * items, items);
  const [receipt, setReceipt] = useState<{ fileId?: string; preview?: string; busy?: boolean; error?: string }>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (receipt.preview) URL.revokeObjectURL(receipt.preview);
  }, [receipt.preview]);

  if (!instapayReady()) {
    return (
      <div role="status" className="mt-8 rounded-[28px] bg-butter p-6">
        <p className="font-display text-2xl">Ordering opens very soon</p>
        <p className="mt-1">We&apos;re setting up InstaPay payments. Your bag is saved on this device, so come back in a little while.</p>
      </div>
    );
  }

  const upload = async (file: File | undefined) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setReceipt({ busy: true, preview });
    try {
      setReceipt({ fileId: await uploadFile("receipt", file), preview });
    } catch (e) {
      setReceipt({ error: (e as Error).message, preview });
    }
  };

  const receiptError = receipt.error ?? (!receipt.fileId ? errors.receipt : undefined);
  const field = "mt-1.5 h-13 w-full rounded-2xl border-2 border-grape/20 bg-white px-4 text-lg outline-none focus:border-grape aria-invalid:border-gum-deep";

  return (
    <section aria-labelledby="deposit-title" className="mt-10">
      <h2 id="deposit-title" className="font-display text-3xl">
        Pay the deposit
      </h2>
      <p className="mt-1 opacity-80">
        Send a deposit of {formatPrice(deposit)} with InstaPay to confirm your order
        {items > 1 ? ` (${formatPrice(INSTAPAY.depositAmount)} for each of your ${items} pieces).` : "."}
        {total != null && ` The rest, ${formatPrice(total - deposit)}, is paid in cash on delivery.`}
      </p>

      <ol className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-4">
        <li className="rounded-[24px] bg-white p-5 ring-2 ring-grape/10">
          <p className="font-semibold">
            <span className="mr-2 inline-grid size-7 place-items-center rounded-full bg-grape text-sm text-milk">1</span>
            Send {formatPrice(deposit)} on InstaPay to:
          </p>
          <dl className="mt-3 grid gap-2">
            {INSTAPAY.address && (
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-milk px-4 py-3">
                <div className="min-w-0">
                  <dt className="text-sm opacity-70">InstaPay address</dt>
                  <dd className="text-base font-bold wrap-anywhere min-[360px]:text-lg">
                    {/* on narrow phones, wrap before the @ rather than mid-name */}
                    {INSTAPAY.address.split("@")[0]}
                    <wbr />@{INSTAPAY.address.split("@").slice(1).join("@")}
                  </dd>
                </div>
                <Copy value={INSTAPAY.address} label="InstaPay address" />
              </div>
            )}
            {INSTAPAY.phone && (
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-milk px-4 py-3">
                <div className="min-w-0">
                  <dt className="text-sm opacity-70">Mobile number</dt>
                  <dd className="text-lg font-bold tabular-nums">{INSTAPAY.phone}</dd>
                </div>
                <Copy value={INSTAPAY.phone} label="mobile number" />
              </div>
            )}
            {INSTAPAY.accountName && (
              <div className="px-1 text-sm">
                <dt className="inline opacity-70">Name shown in InstaPay: </dt>
                <dd className="inline font-semibold">{INSTAPAY.accountName}</dd>
              </div>
            )}
          </dl>
          {INSTAPAY.link && (
            <a href={INSTAPAY.link} target="_blank" rel="noopener noreferrer" className="btn btn-ghost mt-3">
              Open InstaPay
            </a>
          )}
          {/* Phone shoppers can't scan their own screen, so the QR is for computers */}
          {INSTAPAY.qr && (
            <div className="mt-4 hidden items-center gap-4 rounded-2xl bg-milk p-3 sm:flex">
              <Image src={INSTAPAY.qr} alt="InstaPay QR code" width={130} height={129} className="rounded-xl bg-white" />
              <p className="text-sm">
                <span className="block font-semibold">On a computer?</span>
                Scan this with the InstaPay app on your phone.
              </p>
            </div>
          )}
        </li>

        <li className="rounded-[24px] bg-white p-5 ring-2 ring-grape/10">
          <p className="font-semibold">
            <span className="mr-2 inline-grid size-7 place-items-center rounded-full bg-grape text-sm text-milk">2</span>
            Tell us it&apos;s done
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="co-payer" className="font-semibold">
                Name or InstaPay number you paid from
              </label>
              <input
                id="co-payer"
                name="payer"
                autoComplete="off"
                aria-invalid={!!errors.payer}
                aria-describedby={errors.payer ? "co-payer-err" : undefined}
                className={field}
              />
              {errors.payer && (
                <p id="co-payer-err" className="mt-1 text-sm font-semibold text-gum-deep">
                  {errors.payer}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="co-reference" className="font-semibold">
                Transfer reference <span className="font-normal opacity-60">(optional)</span>
              </label>
              <input id="co-reference" name="reference" autoComplete="off" className={field} />
            </div>
            <div className="sm:col-span-2">
              <span id="co-receipt-label" className="font-semibold">
                Screenshot of the transfer
              </span>
              <input type="hidden" name="receiptFileId" value={receipt.fileId ?? ""} />
              <label
                className={`mt-1.5 flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed p-3 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-grape ${
                  receiptError ? "border-gum-deep" : "border-grape/30 hover:border-grape/60"
                }`}
              >
                <input
                  id="co-receipt"
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  aria-labelledby="co-receipt-label"
                  aria-describedby={receiptError ? "co-receipt-err" : undefined}
                  onChange={(e) => upload(e.target.files?.[0])}
                />
                <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-milk">
                  {receipt.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen file
                    <img src={receipt.preview} alt="" className="size-full object-cover" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="size-7 text-gum" aria-hidden>
                      <path d="M12 16V4m0 0-5 5m5-5 5 5M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="font-medium">
                  {receipt.busy
                    ? "Uploading…"
                    : receipt.fileId
                      ? "Screenshot added. Tap to change it."
                      : "Tap to add the screenshot from InstaPay"}
                </span>
              </label>
              {receiptError && (
                <p id="co-receipt-err" role="alert" className="mt-1 text-sm font-semibold text-gum-deep">
                  {receiptError}
                </p>
              )}
            </div>
          </div>
        </li>
      </ol>
      <p className="mt-3 text-sm opacity-70">We check every deposit by hand and call you to confirm before printing.</p>
    </section>
  );
}
