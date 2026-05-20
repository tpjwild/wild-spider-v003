import { AuthGate } from "@/components/auth/AuthGate";
import { AuthAppChrome } from "@/components/layout/AuthAppChrome";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AuthAppChrome>{children}</AuthAppChrome>
    </AuthGate>
  );
}
