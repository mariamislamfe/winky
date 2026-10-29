import Link from "next/link";
import { Suspense } from "react";
import { AdminBar } from "@/components/admin/AdminBar";
import { DeleteEntryButton, ExpenseForm, OutsideSaleForm } from "@/components/admin/FinanceForms";
import { EXPENSE_CATEGORIES } from "@/config/finance";
import { PROFIT_PER_ITEM } from "@/config/pricing";
import { activeMonths, ALL_TIME, cairoDay, monthLabel, summarize, type LedgerRow } from "@/lib/finance";
import { formatPrice } from "@/lib/format";
import { requireAdmin } from "@/lib/server/auth";
import { readOrders } from "@/lib/server/orders";
import { readFinanceEntries } from "@/lib/server/settings";

export const metadata = { title: "Finance" };

export default function FinancePage({ searchParams }: PageProps<"/admin/finance">) {
  return (
    <>
      <AdminBar />
      <main id="main" className="mx-auto max-w-[1100px] px-5 py-10">
        <h1 className="font-display text-5xl">Finance</h1>
        <p className="mt-2 max-w-[64ch] opacity-75">
          Profit is counted at {formatPrice(PROFIT_PER_ITEM.case.regular)} per case and {formatPrice(PROFIT_PER_ITEM.case.custom)} per
          custom case, from every website order that isn&apos;t cancelled plus the outside orders you add here. Expenses come off the
          top.
        </p>
        <Suspense fallback={<p className="py-20 text-center opacity-60">Loading…</p>}>
          <Finance searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}

async function Finance({ searchParams }: { searchParams: PageProps<"/admin/finance">["searchParams"] }) {
  await requireAdmin();
  const [orders, entries, params] = await Promise.all([readOrders(), readFinanceEntries(), searchParams]);
  const months = activeMonths(orders, entries);
  const month = typeof params.month === "string" && months.includes(params.month) ? params.month : ALL_TIME;
  const { rows, totals, byCategory } = summarize(orders, entries, month);
  const period = month === ALL_TIME ? "All time" : monthLabel(month);
  const today = cairoDay(new Date());
  const card = "rounded-[28px] bg-white p-5 ring-2 ring-grape/10";

  return (
    <>
      <nav aria-label="Period" className="mt-6 flex flex-wrap gap-2">
        {[ALL_TIME, ...months].map((m) => (
          <Link
            key={m}
            href={m === ALL_TIME ? "/admin/finance" : `/admin/finance?month=${m}`}
            aria-current={m === month ? "page" : undefined}
            className="inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold ring-2 ring-grape/15 hover:ring-grape/40 aria-[current=page]:bg-grape aria-[current=page]:text-milk aria-[current=page]:ring-grape"
          >
            {m === ALL_TIME ? "All time" : monthLabel(m)}
          </Link>
        ))}
      </nav>

      <h2 className="sr-only">{period} totals</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <section className={`rounded-[28px] p-5 sm:col-span-2 lg:col-span-1 ${totals.net >= 0 ? "bg-mint" : "bg-gum/20"}`}>
          <h3 className="font-semibold">Net profit</h3>
          <p className="font-display mt-1 text-4xl tabular-nums">
            {totals.net < 0 ? "−" : ""}
            {formatPrice(Math.abs(totals.net))}
          </p>
          <p className="mt-1 text-sm opacity-75">Profit from orders minus expenses</p>
        </section>
        <section className={card}>
          <h3 className="font-semibold">Profit from orders</h3>
          <p className="font-display mt-1 text-3xl tabular-nums">{formatPrice(totals.profit)}</p>
          <p className="mt-1 text-sm opacity-75">
            {totals.cases} {totals.cases === 1 ? "case" : "cases"}, {totals.customCases} custom
          </p>
        </section>
        <section className={card}>
          <h3 className="font-semibold">Expenses</h3>
          <p className="font-display mt-1 text-3xl tabular-nums">{formatPrice(totals.expenses)}</p>
          <dl className="mt-1 grid gap-0.5 text-sm">
            {EXPENSE_CATEGORIES.filter((c) => byCategory[c.id]).map((c) => (
              <div key={c.id} className="flex justify-between gap-2">
                <dt className="opacity-75">{c.label}</dt>
                <dd className="tabular-nums">{formatPrice(byCategory[c.id])}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className={card}>
          <h3 className="font-semibold">Orders</h3>
          <p className="font-display mt-1 text-3xl tabular-nums">{totals.websiteOrders + totals.outsideOrders}</p>
          <p className="mt-1 text-sm opacity-75">
            {totals.websiteOrders} on the website, {totals.outsideOrders} outside
          </p>
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="grid h-fit gap-6">
          <section className={card}>
            <h2 className="font-display text-2xl">Add an expense</h2>
            <p className="mt-1 text-sm opacity-75">Ads, materials, packaging… anything you paid for.</p>
            <ExpenseForm today={today} />
          </section>
          <section className={card}>
            <h2 className="font-display text-2xl">Add an outside order</h2>
            <p className="mt-1 text-sm opacity-75">An order that didn&apos;t come through the website, e.g. on Instagram.</p>
            <OutsideSaleForm today={today} />
          </section>
        </div>

        <section className={card}>
          <h2 className="font-display text-2xl">{period}</h2>
          {rows.length === 0 ? (
            <p className="mt-3 opacity-70">Nothing yet for this period.</p>
          ) : (
            <ul className="mt-3 divide-y-2 divide-grape/5">
              {rows.map((r) => (
                <Row key={r.kind === "order" ? r.order.id : r.entry.id} row={r} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

const shortDay = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

const piecesText = (cases: number, custom: number) =>
  [cases ? `${cases} ${cases === 1 ? "case" : "cases"}` : "", custom ? `${custom} custom` : ""].filter(Boolean).join(", ");

function Row({ row }: { row: LedgerRow }) {
  let title: React.ReactNode;
  let detail: string;
  let amount: number;
  if (row.kind === "order") {
    title = (
      <Link href={`/admin/orders/${row.order.id}`} className="underline-offset-4 hover:underline">
        {row.order.number}, {row.order.customer.name}
      </Link>
    );
    detail = `Website · ${piecesText(row.cases, row.customCases) || "no cases"}`;
    amount = row.profit;
  } else if (row.kind === "sale") {
    title = row.entry.note || "Outside order";
    const extra = row.entry.extra ? `+ ${formatPrice(row.entry.extra)} other` : "";
    detail = `Outside order · ${[piecesText(row.entry.cases, row.entry.customCases), extra].filter(Boolean).join(" ")}`;
    amount = row.profit;
  } else {
    const category = EXPENSE_CATEGORIES.find((c) => c.id === row.entry.category)?.label ?? "Expense";
    title = row.entry.note || category;
    detail = `Expense · ${category}`;
    amount = row.entry.amount;
  }
  const out = row.kind === "expense";

  return (
    <li className="flex items-center gap-3 py-3">
      <span className="w-14 shrink-0 text-sm font-semibold tabular-nums opacity-70">{shortDay(row.date)}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold break-words">{title}</span>
        <span className="block text-sm opacity-70">{detail}</span>
      </span>
      <span className={`shrink-0 font-bold tabular-nums ${out ? "text-gum-deep" : ""}`}>
        {out ? "−" : "+"}
        {formatPrice(amount)}
      </span>
      {row.kind !== "order" && <DeleteEntryButton id={row.entry.id} />}
    </li>
  );
}
