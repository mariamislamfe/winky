"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="mt-6 grid gap-3">
      <label htmlFor="password" className="font-semibold">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        autoFocus
        aria-invalid={!!state.error}
        aria-describedby={state.error ? "login-error" : undefined}
        className="h-13 rounded-2xl border-2 border-grape/20 bg-white px-4 text-lg outline-none focus:border-grape"
      />
      {state.error && (
        <p id="login-error" role="alert" className="font-semibold text-gum-deep">
          {state.error}
        </p>
      )}
      <button type="submit" className="btn mt-2" disabled={pending}>
        {pending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
