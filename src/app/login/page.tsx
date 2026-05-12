import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh w-full flex-1 flex-col bg-[#0f1419]">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center px-6 text-zinc-400">Loading…</div>
        }
      >
        <LoginPageClient />
      </Suspense>
    </div>
  );
}
