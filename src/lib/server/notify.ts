import "server-only";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";
import { readNotifyTopic } from "./settings";

/**
 * Phone notifications through ntfy (free, no account): the ntfy app on the
 * phone subscribes to the store's private channel, set up in the dashboard
 * (/admin/notifications).
 */
export const NTFY_SERVER = "https://ntfy.sh";

export async function sendNotification(topic: string, note: { title: string; message: string; click?: string; tags?: string[] }) {
  const res = await fetch(NTFY_SERVER, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, priority: 4, ...note }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`ntfy answered ${res.status}`);
}

/** "New order" on the phone; tapping it opens the order in the dashboard. Never throws. */
export async function notifyNewOrder(order: Order, origin: string) {
  try {
    const topic = await readNotifyTopic();
    if (!topic) return;
    const items = order.lines.reduce((n, l) => n + l.quantity, 0);
    const custom = order.lines.some((l) => l.custom);
    await sendNotification(topic, {
      title: `New order ${order.number}`,
      message: [
        `${order.customer.name}, ${order.customer.governorate}`,
        `${items} ${items === 1 ? "item" : "items"}${custom ? " (custom design)" : ""}, total ${formatPrice(order.total)}`,
        `Deposit ${formatPrice(order.deposit.amount)}: check the InstaPay screenshot`,
      ].join("\n"),
      click: `${origin}/admin/orders/${order.id}`,
      tags: ["shopping_bags"],
    });
  } catch (err) {
    console.error("Order notification failed", err);
  }
}
