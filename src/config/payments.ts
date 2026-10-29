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
  /** Deposit per item (each piece in the bag), in piasters (10000 = EGP 100) */
  depositAmount: 10000,
  /** InstaPay address (IPA), e.g. "winky@instapay" */
  address: "malakhamamah@instapay",
  /** Mobile number linked to your InstaPay account */
  phone: "01116361917",
  /** The name customers will see in InstaPay when they send the money */
  accountName: "",
  /** Optional: an InstaPay payment link (the link inside your InstaPay QR code) */
  link: "https://ipn.eg/C/Q/malakhamamah/instapay?ISIGN=23052602MEYCIQCWjQ/81bwj6Hr9Ut62C+5Pg2g8ppxYR7K9UJj5SHE33gIhALJ7F7/3T47SnnTGiTyMra1nJg4C8+QGcxg7+EQCNkUR",
  /** Optional: your InstaPay QR code image in /public, shown to shoppers on a computer */
  qr: "/instapay-qr.png",
} as const;

export const instapayReady = () => Boolean(INSTAPAY.address || INSTAPAY.phone);

/** Deposit for an order: EGP 100 per item, never more than the order total. */
export const depositFor = (total: number, items: number) => Math.min(INSTAPAY.depositAmount * Math.max(1, items), total);
