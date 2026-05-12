import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/components/auth/AuthProvider";
import Home from "./(authenticated)/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
}));

describe("Home", () => {
  it("renders Wild Spider heading after client hydrate", async () => {
    render(
      <AuthProvider>
        <Home />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /WILD SPIDER/i }),
      ).toBeInTheDocument();
    });
  });
});
