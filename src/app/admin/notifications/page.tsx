import { Suspense } from "react";
import { AdminBar } from "@/components/admin/AdminBar";
import { CopyButton } from "@/components/admin/CopyButton";
import { TestNotificationButton } from "@/components/admin/TestNotificationButton";
import { requireAdmin } from "@/lib/server/auth";
import { ensureNotifyTopic } from "@/lib/server/settings";

export const metadata = { title: "Order notifications" };

const APPS = [
  { label: "Android (Google Play)", href: "https://play.google.com/store/apps/details?id=io.heckel.ntfy" },
  { label: "iPhone (App Store)", href: "https://apps.apple.com/app/ntfy/id1625396347" },
];

export default function NotificationsPage() {
  return (
    <>
      <AdminBar />
      <main id="main" className="mx-auto max-w-[760px] px-5 py-10">
        <h1 className="font-display text-5xl">Order notifications</h1>
        <p className="mt-2 max-w-[60ch] opacity-75">
          Get a notification on your phone the moment someone places an order. Tapping it opens the order here. Set it up once on
          every phone that should get them.
        </p>
        <div className="mt-8">
          <Suspense fallback={<p className="py-20 text-center opacity-60">Loading…</p>}>
            <Setup />
          </Suspense>
        </div>
      </main>
    </>
  );
}

async function Setup() {
  await requireAdmin();
  const topic = await ensureNotifyTopic();
  const step = "rounded-[28px] bg-white p-5 ring-2 ring-grape/10 md:p-6";
  const num = "grid size-9 shrink-0 place-items-center rounded-full bg-grape font-bold text-milk";

  return (
    <ol className="grid gap-4">
      <li className={step}>
        <div className="flex gap-4">
          <span className={num}>1</span>
          <div className="min-w-0">
            <h2 className="font-display text-2xl">Install the free ntfy app</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {APPS.map((a) => (
                <a
                  key={a.href}
                  href={a.href}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex min-h-11 items-center rounded-full px-4 font-semibold ring-2 ring-grape/20 hover:ring-grape/50"
                >
                  {a.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </li>

      <li className={step}>
        <div className="flex gap-4">
          <span className={num}>2</span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl">Subscribe to WINKY&apos;s channel</h2>
            <p className="mt-1 opacity-80">
              In the app, tap <strong>+</strong>, paste this channel name, and tap <strong>Subscribe</strong>. Allow notifications
              when your phone asks.
            </p>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-milk p-3">
              <code className="min-w-0 font-semibold break-all">{topic}</code>
              <CopyButton value={topic} label="channel name" />
            </div>
            <p className="mt-2 text-sm opacity-70">
              Keep this name private: anyone who has it can see the order notifications.
            </p>
          </div>
        </div>
      </li>

      <li className={step}>
        <div className="flex gap-4">
          <span className={num}>3</span>
          <div className="min-w-0">
            <h2 className="font-display text-2xl">Check it works</h2>
            <p className="mt-1 opacity-80">It should arrive on your phone within a few seconds.</p>
            <TestNotificationButton />
          </div>
        </div>
      </li>
    </ol>
  );
}
