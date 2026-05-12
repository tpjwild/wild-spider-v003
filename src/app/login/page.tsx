import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0f1419] text-zinc-400">Loading…</div>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}
