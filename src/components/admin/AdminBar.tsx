import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { Wordmark } from "@/components/brand/Wordmark";
import { instapayReady } from "@/config/payments";

export function AdminBar() {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-grape/10 bg-milk/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3 px-5 py-3">
        <Link href="/admin" className="flex min-h-11 items-center gap-3" aria-label="Dashboard home">
          <Wordmark className="text-[2rem]" />
          <span className="rounded-full bg-grape px-3 py-1 text-sm font-semibold text-milk">Dashboard</span>
        </Link>
        <nav aria-label="Dashboard" className="flex flex-wrap items-center gap-2">
          <Link href="/admin" className="rounded-full px-4 py-2 font-semibold hover:bg-grape/10">
            Products
          </Link>
          <Link href="/admin/orders" className="rounded-full px-4 py-2 font-semibold hover:bg-grape/10">
            Orders
          </Link>
          <Link href="/admin/delivery" className="rounded-full px-4 py-2 font-semibold hover:bg-grape/10">
            Delivery
          </Link>
          <Link href="/" target="_blank" className="rounded-full px-4 py-2 font-semibold hover:bg-grape/10">
            View store
          </Link>
          <form action={logout}>
            <button type="submit" className="rounded-full px-4 py-2 font-semibold hover:bg-grape/10">
              Log out
            </button>
          </form>
        </nav>
      </div>
      {!instapayReady() && (
        <p className="bg-butter px-5 py-2 text-center text-sm font-semibold">
          Ordering is paused: add your InstaPay number or address in <code>src/config/payments.ts</code> to open checkout.
        </p>
      )}
    </header>
  );
}
