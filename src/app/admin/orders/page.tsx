import Link from "next/link";
import { Suspense } from "react";
import { AdminBar } from "@/components/admin/AdminBar";
import { WinkMark } from "@/components/brand/WinkMark";
import { DEPOSIT_STATUSES, ORDER_STATUSES } from "@/config/orders";
import { formatDate, formatPrice } from "@/lib/format";
import { requireAdmin } from "@/lib/server/auth";
import { readOrders } from "@/lib/server/orders";

export const metadata = { title: "Orders" };

export default function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <>
      <AdminBar />
      <main id="main" className="mx-auto max-w-[1100px] px-5 py-10">
        <Suspense fallback={<p className="py-20 text-center opacity-60">Loading orders…</p>}>
          <OrderList searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}

async function OrderList({ searchParams }: { searchParams: PageProps<"/admin/orders">["searchParams"] }) {
  await requireAdmin();
  const [orders, params] = await Promise.all([readOrders(), searchParams]);
  const filter = typeof params.status === "string" ? params.status : "all";
  const shown = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const count = (id: string) => orders.filter((o) => o.status === id).length;

  return (
    <>
      <h1 className="font-display text-5xl">Orders</h1>
      <p className="mt-1 opacity-75">
        {orders.length} {orders.length === 1 ? "order" : "orders"}, {count("new")} new. Open one to see everything you need to place it on Zink.
      </p>

      <nav aria-label="Filter orders" className="mt-6 flex flex-wrap gap-2">
        {[{ id: "all", label: "All", n: orders.length }, ...ORDER_STATUSES.map((s) => ({ id: s.id, label: s.label, n: count(s.id) }))].map((f) => (
          <Link
            key={f.id}
            href={f.id === "all" ? "/admin/orders" : `/admin/orders?status=${f.id}`}
            aria-current={filter === f.id ? "page" : undefined}
            className="inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold ring-2 ring-grape/15 hover:ring-grape/40 aria-[current=page]:bg-grape aria-[current=page]:text-milk aria-[current=page]:ring-grape"
          >
            {f.label} <span className="tabular-nums opacity-70">{f.n}</span>
          </Link>
        ))}
      </nav>

      {shown.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-[32px] bg-white px-6 py-16 text-center ring-2 ring-grape/10">
          <WinkMark className="w-20 text-gum" />
          <p className="font-display text-3xl">{orders.length ? "Nothing here" : "No orders yet"}</p>
          <p className="max-w-[42ch] opacity-75">
            {orders.length ? "No orders with this status." : "When a customer checks out, the order shows up here right away."}
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {shown.map((o) => {
            const status = ORDER_STATUSES.find((s) => s.id === o.status)!;
            const deposit = DEPOSIT_STATUSES.find((s) => s.id === o.deposit?.status);
            const items = o.lines.reduce((n, l) => n + l.quantity, 0);
            const hasCustom = o.lines.some((l) => l.custom);
            return (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[24px] bg-white p-4 ring-2 ring-grape/10 transition-shadow hover:ring-grape/40"
                >
                  <div className="min-w-[8rem]">
                    <p className="text-lg font-bold tabular-nums">{o.number}</p>
                    <p className="text-sm opacity-70">{formatDate(o.createdAt)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{o.customer.name}</p>
                    <p className="text-sm opacity-70">
                      {o.customer.phone}, {o.customer.governorate}
                    </p>
                  </div>
                  <p className="text-sm">
                    {items} {items === 1 ? "item" : "items"}
                    {hasCustom && <span className="ml-2 rounded-full bg-gum/20 px-2 py-0.5 text-xs font-bold">Custom</span>}
                  </p>
                  <p className="font-bold tabular-nums">{formatPrice(o.total)}</p>
                  {deposit && (
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${deposit.tone}`}>Deposit: {deposit.label.toLowerCase()}</span>
                  )}
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.tone}`}>{status.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
