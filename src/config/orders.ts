import type { OrderStatus } from "@/lib/types";

/**
 * Checkout and order settings.
 *
 * Orders are cash on delivery: Zink prints, delivers and collects the cash.
 */

export const GOVERNORATES = [
  "Cairo", "Giza", "Alexandria", "Qalyubia", "Sharqia", "Dakahlia", "Gharbia",
  "Monufia", "Beheira", "Kafr El Sheikh", "Damietta", "Port Said", "Ismailia",
  "Suez", "North Sinai", "South Sinai", "Red Sea", "Faiyum", "Beni Suef", "Minya",
  "Asyut", "Sohag", "Qena", "Luxor", "Aswan", "Matrouh", "New Valley",
] as const;

export type Governorate = (typeof GOVERNORATES)[number];

/**
 * Delivery fee per governorate in piasters, set in the dashboard
 * (/admin/delivery) and added to the order total. A governorate without a
 * fee is confirmed on the phone instead.
 */
export type DeliveryFees = Partial<Record<Governorate, number>>;

export const ORDER_STATUSES: { id: OrderStatus; label: string; tone: string }[] = [
  { id: "new", label: "New", tone: "bg-butter" },
  { id: "placed", label: "Placed on Zink", tone: "bg-[#cfd3ff]" },
  { id: "shipped", label: "Shipped", tone: "bg-[#FFD1E4]" },
  { id: "delivered", label: "Delivered", tone: "bg-mint" },
  { id: "cancelled", label: "Cancelled", tone: "bg-grape/15" },
];

export const DEPOSIT_STATUSES = [
  { id: "pending", label: "Waiting to check", tone: "bg-butter" },
  { id: "received", label: "Received", tone: "bg-mint" },
  { id: "rejected", label: "Not received", tone: "bg-gum/30" },
] as const;

/** Customer design uploads (originals kept for printing) */
export const DESIGN_UPLOAD = {
  maxFileMb: 15,
  /** Longest side kept on the server */
  maxPx: 6000,
  /** Uploads allowed per visitor per 10 minutes (basic abuse guard) */
  perTenMinutes: 30,
} as const;

/** Print file exported from the dashboard when the print area size is unknown */
export const PRINT_FILE_DEFAULT_WIDTH_PX = 3000;
export const PRINT_DPI = 300;
