"use server";

import { redirect } from "next/navigation";
import { ORDER_STATUSES } from "@/config/orders";
import { requireAdmin } from "@/lib/server/auth";
import { removeOrder, updateOrder } from "@/lib/server/orders";
import type { DepositStatus, OrderStatus } from "@/lib/types";

export type OrderUpdateState = { saved?: boolean; error?: string };

export async function saveOrderAdmin(id: string, _prev: OrderUpdateState, form: FormData): Promise<OrderUpdateState> {
  await requireAdmin();
  const status = String(form.get("status") ?? "") as OrderStatus;
  if (!ORDER_STATUSES.some((s) => s.id === status)) return { error: "Choose a status." };
  const depositStatus = String(form.get("depositStatus") ?? "") as DepositStatus;
  if (!["pending", "received", "rejected"].includes(depositStatus)) return { error: "Choose the deposit status." };
  const updated = await updateOrder(id, {
    status,
    depositStatus,
    zinkRef: String(form.get("zinkRef") ?? ""),
    adminNote: String(form.get("adminNote") ?? ""),
  });
  if (!updated) return { error: "This order no longer exists." };
  return { saved: true };
}

export async function deleteOrder(id: string) {
  await requireAdmin();
  await removeOrder(id);
  redirect("/admin/orders?deleted=1");
}
