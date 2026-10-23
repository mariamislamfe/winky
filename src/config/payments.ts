/**
 * InstaPay deposit.
 *
 * Every order needs a fixed deposit paid by InstaPay; the rest is paid in
 * cash on delivery (collected by Zink). InstaPay has no API to confirm
 * transfers automatically, so customers upload a screenshot of the transfer
 * and you mark the deposit as received in the dashboard.
 *
 * Ordering stays paused until `address` or `phone` is filled in.
 */
export const INSTAPAY = {
  /** Deposit per order, in piasters (10000 = EGP 100) */
  depositAmount: 10000,
  /** InstaPay address (IPA), e.g. "winky@instapay" */
  address: "",
  /** Mobile number linked to your InstaPay account */
  phone: "",
  /** The name customers will see in InstaPay when they send the money */
  accountName: "",
  /** Optional: an InstaPay payment link (from the app's "payment link" option) */
  link: "",
} as const;

export const instapayReady = () => Boolean(INSTAPAY.address || INSTAPAY.phone);

/** Deposit actually charged for an order total (never more than the total). */
export const depositFor = (total: number) => Math.min(INSTAPAY.depositAmount, total);
