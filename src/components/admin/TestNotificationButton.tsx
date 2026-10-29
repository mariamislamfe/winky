"use client";

import { useActionState } from "react";
import { sendTestNotification, type NotifyState } from "@/app/admin/actions";

export function TestNotificationButton() {
  const [state, action, sending] = useActionState<NotifyState>(sendTestNotification, {});
  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-3">
      <button type="submit" className="btn" disabled={sending}>
        {sending ? "Sending…" : "Send a test notification"}
      </button>
      {state.sent && !sending && (
        <p role="status" className="font-semibold">
          Sent{state.sent > 1 ? ` (${state.sent})` : ""}. Didn&apos;t get it? Check step 2 and that notifications are allowed.
        </p>
      )}
      {state.error && (
        <p role="alert" className="font-semibold text-gum-deep">
          {state.error}
        </p>
      )}
    </form>
  );
}
