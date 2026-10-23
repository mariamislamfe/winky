import type { Metadata } from "next";
import { Wordmark } from "@/components/brand/Wordmark";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-gum px-5">
      <div className="w-full max-w-sm rounded-[32px] bg-milk p-7 shadow-[8px_10px_0_0_var(--color-grape)]">
        <Wordmark className="text-5xl" />
        <h1 className="font-display mt-4 text-3xl">Dashboard</h1>
        <p className="mt-1 opacity-75">Log in to add and edit products.</p>
        <LoginForm />
      </div>
    </main>
  );
}
