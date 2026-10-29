import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { Wordmark } from "@/components/brand/Wordmark";
import { instapayReady } from "@/config/payments";

export function AdminBar() {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-grape/10 bg-milk/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-x-3 gap-y-1 px-5 py-2 md:py-3">
        <Link href="/admin" className="flex min-h-11 items-center gap-3" aria-label="Dashboard home">
          <Wordmark className="text-[1.6rem] md:text-[2rem]" />
          <span className="rounded-full bg-grape px-3 py-1 text-sm font-semibold text-milk">Dashboard</span>
        </Link>
        {/* Phones: one row that scrolls sideways, so the sticky bar stays short */}
        <nav
          aria-label="Dashboard"
          className="no-scrollbar -mx-5 flex w-[calc(100%+2.5rem)] items-center gap-1 overflow-x-auto px-3 *:shrink-0 *:whitespace-nowrap md:mx-0 md:w-auto md:flex-wrap md:gap-2 md:overflow-visible md:px-0"
        >
          <Link href="/admin" className="rounded-full px-3 py-2 font-semibold hover:bg-grape/10 md:px-4">
            Products
          </Link>
          <Link href="/admin/orders" className="rounded-full px-3 py-2 font-semibold hover:bg-grape/10 md:px-4">
            Orders
          </Link>
          <Link href="/admin/finance" className="rounded-full px-3 py-2 font-semibold hover:bg-grape/10 md:px-4">
            Finance
          </Link>
          <Link href="/admin/delivery" className="rounded-full px-3 py-2 font-semibold hover:bg-grape/10 md:px-4">
            Delivery
          </Link>
          <Link href="/admin/notifications" className="rounded-full px-3 py-2 font-semibold hover:bg-grape/10 md:px-4">
            Notifications
          </Link>
          <Link href="/" target="_blank" className="rounded-full px-3 py-2 font-semibold hover:bg-grape/10 md:px-4">
            View store
          </Link>
          <form action={logout}>
            <button type="submit" className="rounded-full px-3 py-2 font-semibold hover:bg-grape/10 md:px-4">
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
