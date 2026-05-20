import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CardView } from "@/components/game/CardView";

const aceSpades = {
  faceUp: true,
  card: { kind: "regular" as const, id: 0, suit: "S" as const, rank: 1 as const },
};

describe("CardView", () => {
  it("renders face-up rank and suit in corners", () => {
    const { container } = render(<CardView placed={aceSpades} deckPairId="base" />);
    expect(container.textContent).toContain("A");
    expect(container.textContent).toContain("♠");
  });

  it("requests shared pip SVG for rank 2–10", () => {
    const { container } = render(
      <CardView
        deckPairId="base"
        placed={{
          faceUp: true,
          card: { kind: "regular", id: 4, suit: "C", rank: 5 },
        }}
      />,
    );
    const srcs = [...container.querySelectorAll("img")].map((el) => el.getAttribute("src"));
    expect(srcs.some((s) => s?.includes("/gameArt/shared/cards/5C.svg"))).toBe(true);
  });

  it("renders face-down back with art image", () => {
    const { container } = render(
      <CardView
        deckPairId="base"
        placed={{
          faceUp: false,
          card: { kind: "regular", id: 0, suit: "S", rank: 1 },
        }}
      />,
    );
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toContain("/gameArt/shared/backs/back-deck1.png");
    expect(screen.queryByText("♠")).not.toBeInTheDocument();
  });

  it("renders joker corners with vertical letters", () => {
    const { container } = render(
      <CardView
        deckPairId="base"
        placed={{
          faceUp: true,
          card: { kind: "joker", id: 0 },
        }}
      />,
    );
    expect(screen.getByLabelText("Joker")).toBeInTheDocument();
    expect(container.querySelectorAll("img").length).toBeGreaterThanOrEqual(1);
    expect((container.textContent ?? "").replace(/\s/g, "")).toContain("JOKER");
  });

  it("deckPopupFaceDown shows face with semi-transparent back image (transparent effect)", () => {
    const { container } = render(
      <CardView
        deckPairId="base"
        placed={{ faceUp: true, card: { kind: "regular", id: 0, suit: "S", rank: 5 } }}
        displayMode="deckPopupFaceDown"
      />,
    );
    const imgs = [...container.querySelectorAll("img")];
    const backImg = imgs.find((el) => el.getAttribute("src")?.includes("/backs/"));
    expect(backImg).toBeTruthy();
    expect((backImg as HTMLElement).style.opacity).toBe("0.5");
    expect(container.textContent).toContain("5");
  });

  it("deckPopupFaceDown respects faceDownBackOpacity for transparent effect", () => {
    const { container } = render(
      <CardView
        deckPairId="base"
        placed={{ faceUp: false, card: { kind: "regular", id: 0, suit: "S", rank: 13 } }}
        displayMode="deckPopupFaceDown"
        faceDownBackOpacity={0.75}
      />,
    );
    const backImg = [...container.querySelectorAll("img")].find((el) =>
      el.getAttribute("src")?.includes("/backs/"),
    );
    expect(backImg).toBeTruthy();
    expect((backImg as HTMLElement).style.opacity).toBe("0.75");
  });

  it("deckPopupFaceDown on face-down placed still renders face under back overlay", () => {
    const { container } = render(
      <CardView
        deckPairId="base"
        placed={{ faceUp: false, card: { kind: "regular", id: 0, suit: "S", rank: 13 } }}
        displayMode="deckPopupFaceDown"
      />,
    );
    expect(container.textContent).toContain("K");
    const backImg = [...container.querySelectorAll("img")].find((el) =>
      el.getAttribute("src")?.includes("/backs/"),
    );
    expect(backImg).toBeTruthy();
  });
});
