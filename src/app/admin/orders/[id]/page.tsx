import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminBar } from "@/components/admin/AdminBar";
import { CopyButton } from "@/components/admin/CopyButton";
import { DesignFiles, OrderMockup } from "@/components/admin/CustomOrderTools";
import { OrderAdminForm } from "@/components/admin/OrderAdminForm";
import { PLAIN_BASES, TEXT_COLORS, TEXT_STYLES } from "@/config/customization";
import { DEPOSIT_STATUSES, ORDER_STATUSES } from "@/config/orders";
import { CATEGORY_LABEL } from "@/lib/catalog";
import { describePlacement, layerTitle } from "@/lib/describe";
import { formatDate, formatPrice } from "@/lib/format";
import { requireAdmin } from "@/lib/server/auth";
import { readOrder } from "@/lib/server/orders";
import type { Order, OrderLine } from "@/lib/types";

export const metadata = { title: "Order" };

export default function OrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <>
      <AdminBar />
      <main id="main" className="mx-auto max-w-[1100px] px-5 py-10">
        <Suspense fallback={<p className="py-20 text-center opacity-60">Loading order…</p>}>
          <OrderDetail params={params} />
        </Suspense>
      </main>
    </>
  );
}

async function OrderDetail({ params }: { params: PageProps<"/admin/orders/[id]">["params"] }) {
  await requireAdmin();
  const { id } = await params;
  const order = await readOrder(id);
  if (!order) notFound();
  const status = ORDER_STATUSES.find((s) => s.id === order.status)!;
  const deposit = DEPOSIT_STATUSES.find((s) => s.id === order.deposit.status)!;
  const c = order.customer;
  const fullAddress = [c.address, c.city, c.governorate].filter(Boolean).join(", ");

  return (
    <>
      <Link href="/admin/orders" className="text-sm font-semibold underline-offset-4 hover:underline">
        ← All orders
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl tabular-nums">{order.number}</h1>
          <p className="mt-1 opacity-75">
            {formatDate(order.createdAt)}, InstaPay deposit + cash on delivery
          </p>
        </div>
        <span className={`rounded-full px-4 py-1.5 font-bold ${status.tone}`}>{status.label}</span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-6">
          {order.lines.map((line, i) => (
            <LineCard key={i} line={line} index={i} order={order} />
          ))}
        </div>

        <div className="grid h-fit gap-6">
          <Card title="Customer">
            <dl className="grid gap-2">
              <Row label="Name" value={c.name} />
              <Row label="Phone" value={c.phone} href={`tel:${c.phone}`} />
              {c.email && <Row label="Email" value={c.email} href={`mailto:${c.email}`} />}
              <Row label="Governorate" value={c.governorate} />
              <Row label="City / area" value={c.city} />
              <Row label="Address" value={c.address} />
              {c.notes && <Row label="Notes" value={c.notes} />}
            </dl>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-milk p-3 text-sm">
              <span className="min-w-0">{fullAddress}</span>
              <CopyButton value={`${c.name}\n${c.phone}\n${fullAddress}`} label="name, phone and full address" />
            </div>
          </Card>

          <Card title="Payment">
            <dl className="grid gap-1.5">
              <Money label="Subtotal" value={formatPrice(order.subtotal)} />
              <Money label="Delivery" value={order.shipping == null ? "Confirm on the call" : formatPrice(order.shipping)} />
              <Money label="Total" value={formatPrice(order.total)} />
              <Money label="Deposit (InstaPay)" value={formatPrice(order.deposit.amount)} />
              <Money
                label={order.shipping == null ? "Cash on delivery (+ delivery)" : "Cash on delivery"}
                value={formatPrice(order.codBalance)}
                strong
              />
            </dl>
            <div className="mt-4 rounded-2xl bg-milk p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">Deposit</p>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${deposit.tone}`}>{deposit.label}</span>
              </div>
              <dl className="mt-2 grid gap-1 text-sm">
                <Row label="Paid from" value={order.deposit.payer} />
                {order.deposit.reference && <Row label="Reference" value={order.deposit.reference} />}
              </dl>
              <a href={`/api/admin/receipts/${order.deposit.receiptFileId}`} target="_blank" rel="noopener" className="mt-3 block">
                {/* eslint-disable-next-line @next/next/no-img-element -- private, auth-protected file */}
                <img
                  src={`/api/admin/receipts/${order.deposit.receiptFileId}`}
                  alt="Screenshot of the InstaPay transfer"
                  className="max-h-80 w-full rounded-xl bg-white object-contain ring-2 ring-grape/10"
                />
                <span className="mt-1 block text-sm font-semibold underline underline-offset-4">Open full size</span>
              </a>
            </div>
          </Card>

          <Card title="Track on Zink">
            <OrderAdminForm order={order} />
          </Card>
        </div>
      </div>
    </>
  );
}

function LineCard({ line, index, order }: { line: OrderLine; index: number; order: Order }) {
  const color = line.custom ? PLAIN_BASES[line.category].find((b) => b.id === line.custom!.baseId)?.label : null;
  return (
    <section className="rounded-[28px] bg-white p-5 ring-2 ring-grape/10">
      <div className="flex flex-wrap items-start gap-4">
        <div className="grid h-36 w-28 shrink-0 place-items-center overflow-hidden rounded-2xl bg-milk p-2">
          {line.custom ? (
            <OrderMockup custom={line.custom} category={line.category} className="h-full w-auto" />
          ) : line.image ? (
            <Image src={line.image.src} alt="" width={line.image.width} height={line.image.height} sizes="112px" className="h-full w-auto object-contain" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold opacity-70">
            Item {index + 1}, {CATEGORY_LABEL[line.category].one}
            {line.custom && <span className="ml-2 rounded-full bg-gum/20 px-2 py-0.5 text-xs font-bold">Custom design</span>}
          </p>
          <h2 className="font-display mt-1 text-2xl leading-tight">{line.name}</h2>
          <dl className="mt-2 grid gap-1">
            {line.variant && <Row label="Phone model" value={line.variant} />}
            {color && <Row label="Product color" value={color} />}
            <Row label="Quantity" value={String(line.quantity)} />
            <Row label="Price" value={`${formatPrice(line.unitPrice)} each, ${formatPrice(line.unitPrice * line.quantity)} total`} />
          </dl>
          {!line.custom && (
            <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
              <Link href={`/shop/${line.slug}`} target="_blank" className="rounded-full px-3 py-1.5 ring-2 ring-grape/15 hover:ring-grape/40">
                View product
              </Link>
              {line.image && (
                <a href={line.image.src} download className="rounded-full px-3 py-1.5 ring-2 ring-grape/15 hover:ring-grape/40">
                  Download design photo
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {line.custom && (
        <div className="mt-5 border-t-2 border-grape/10 pt-5">
          <DesignFiles custom={line.custom} category={line.category} fileName={`${order.number}-item${index + 1}-print.png`} />
          <div>
            <h3 className="mt-5 font-semibold">Layers</h3>
            <ol className="mt-2 grid gap-3">
              {line.custom.layers.map((layer, k) => (
                <li key={layer.id} className="rounded-2xl bg-milk p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">
                      Layer {k + 1}: {layerTitle(layer)}
                    </p>
                    {layer.kind === "image" && layer.fileId && (
                      <a
                        href={`/api/admin/designs/${layer.fileId}?download=${encodeURIComponent(`${order.number}-${layer.name.replace(/\.[^.]+$/, "")}.${layer.fileId.split(".").pop()}`)}`}
                        className="rounded-full bg-grape px-3 py-1.5 text-xs font-bold text-milk"
                      >
                        Download original
                      </a>
                    )}
                    {layer.kind === "text" && <CopyButton value={layer.text} label="text" />}
                  </div>
                  <dl className="mt-1.5 grid gap-0.5 text-sm">
                    {describePlacement(layer, line.category).map((r) => (
                      <Row key={r.k} label={r.k} value={r.v} />
                    ))}
                    {layer.kind === "text" && (
                      <Row
                        label="Font / colour"
                        value={`${TEXT_STYLES.find((t) => t.id === layer.style)?.label} font, ${TEXT_COLORS.find((t) => t.id === layer.color)?.hex}`}
                      />
                    )}
                  </dl>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] bg-white p-5 ring-2 ring-grape/10">
      <h2 className="font-display mb-3 text-2xl">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3">
      <dt className="font-semibold">{label}</dt>
      <dd className="min-w-0 break-words">
        {href ? (
          <a href={href} className="underline underline-offset-4">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function Money({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${strong ? "mt-1 text-lg font-bold" : ""}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
