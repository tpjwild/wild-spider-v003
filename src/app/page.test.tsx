import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AuthAppChrome } from "@/components/layout/AuthAppChrome";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
}));

describe("authenticated game route", () => {
  it("renders Wild Spider heading after client hydrate", async () => {
    render(
      <AuthProvider>
        <AuthAppChrome>{null}</AuthAppChrome>
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /WILD SPIDER/i })).toBeInTheDocument();
    });
  });
});
