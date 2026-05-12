import { AuthGate } from "@/components/auth/AuthGate";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
