"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import { CloudBusyOverlay } from "@/components/game/CloudBusyOverlay";
import { CardView } from "@/components/game/CardView";
import { DealAnimationLayer } from "@/components/game/DealAnimationLayer";
import { EndGameDialog } from "@/components/game/EndGameDialog";
import { FoundationSlot } from "@/components/game/FoundationSlot";
import { GameBar } from "@/components/game/GameBar";
import { NewGameDialog } from "@/components/game/NewGameDialog";
import { ShelfStrip } from "@/components/game/ShelfStrip";
import { StockPile } from "@/components/game/StockPile";
import { TableauColumn } from "@/components/game/TableauColumn";
import { colors } from "@/constants/colors";
import { dimensions } from "@/constants/dimensions";
import { layoutSpring, timings } from "@/constants/timings";
import { cardLayoutId } from "@/lib/cardLayoutId";
import { applyDealEntriesProgress, canDealFromStock } from "@/engine/deal";
import { applyInitialDealEntriesProgress } from "@/engine/initialDeal";
import type { FoundationIndex, PlacedCard } from "@/engine/types";
import { clearGameState } from "@/lib/gameStorage";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchSavedGame, upsertSavedGame } from "@/lib/savedGamesRemote";
import { useGameStore } from "@/state/gameStore";

const { cardHeight: ch, tableauColumnCardOffset: off } = dimensions;

const collision: CollisionDetection = (args) => {
  const first = pointerWithin(args);
  if (first.length) return first;
  return closestCorners(args);
};

/** Shown in Actions menu (Alt is Option on macOS). Must match `e.code` in the hotkey handler. */
const ACTION_MENU_CHORDS = {
  newGame: "Alt+Shift+N",
  restart: "Alt+Shift+A",
  save: "Alt+Shift+S",
  loadGame: "Alt+Shift+L",
  endGame: "Alt+Shift+E",
  logout: "Alt+Shift+O",
  undo: "Alt+Shift+U",
} as const;

function isTextEntryElement(el: HTMLElement): boolean {
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag !== "INPUT") return false;
  const t = (el as HTMLInputElement).type;
  return !["button", "submit", "reset", "checkbox", "radio", "file", "hidden"].includes(t);
}

export function GameShell() {
  const router = useRouter();
  const pathname = usePathname();
  const { bypass, signOut, user } = useAuth();

  const titleBarUserLabel = useMemo(() => {
    if (!user) return null;
    const meta = user.user_metadata as Record<string, unknown> | undefined;
    const fromMeta = (key: string) => {
      const v = meta?.[key];
      return typeof v === "string" ? v.trim() : "";
    };
    const fullName = fromMeta("full_name");
    if (fullName) return fullName;
    const name = fromMeta("name");
    if (name) return name;
    const email = user.email?.trim();
    if (!email) return null;
    const at = email.indexOf("@");
    return at > 0 ? email.slice(0, at) : email;
  }, [user]);

  const game = useGameStore((s) => s.game);
  const dealAnimation = useGameStore((s) => s.dealAnimation);
  const sessionKey = useGameStore((s) => s.sessionKey);
  const openNewGame = useGameStore((s) => s.openNewGame);
  const restart = useGameStore((s) => s.restart);
  const openEndGame = useGameStore((s) => s.openEndGame);
  const undoMove = useGameStore((s) => s.undoMove);
  const tryDeal = useGameStore((s) => s.tryDeal);
  const tryMoveTableau = useGameStore((s) => s.tryMoveTableau);
  const tryMoveToFoundation = useGameStore((s) => s.tryMoveToFoundation);
  const markCloudSaveComplete = useGameStore((s) => s.markCloudSaveComplete);
  const resetForLogout = useGameStore((s) => s.resetForLogout);
  const applyCloudBootstrap = useGameStore((s) => s.applyCloudBootstrap);
  const clearError = useGameStore((s) => s.clearError);
  const lastError = useGameStore((s) => s.lastError);

  const [overlayCards, setOverlayCards] = useState<PlacedCard[] | null>(null);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [cloudSaveBusy, setCloudSaveBusy] = useState(false);
  const [cloudLoadBusy, setCloudLoadBusy] = useState(false);
  const [loadGameConfirmOpen, setLoadGameConfirmOpen] = useState(false);
  const [saveCompleteDialogOpen, setSaveCompleteDialogOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDetailsElement>(null);

  const closeActionsMenu = useCallback(() => {
    const el = actionsMenuRef.current;
    if (el) el.open = false;
  }, []);

  useEffect(() => {
    if (!actionsMenuOpen) return;
    const details = actionsMenuRef.current;
    if (!details) return;

    const close = () => {
      details.open = false;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (details.contains(e.target as Node)) return;
      close();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      close();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [actionsMenuOpen]);

  useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const t = e.target;
      if (t instanceof HTMLElement && t.closest('[aria-modal="true"]')) return;
      setNavOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [navOpen]);

  /** Escape skips in-progress initial or stock deal animations (not while a modal dialog is open). */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (e.repeat) return;
      const t = e.target;
      if (t instanceof HTMLElement) {
        if (t.closest('[aria-modal="true"]')) return;
        if (isTextEntryElement(t)) return;
      }
      const { dealAnimation, newGameOpen, endGameOpen } = useGameStore.getState();
      if (newGameOpen || endGameOpen || loadGameConfirmOpen || saveCompleteDialogOpen) return;
      if (!dealAnimation) return;
      e.preventDefault();
      e.stopPropagation();
      useGameStore.getState().skipDealAnimation();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [loadGameConfirmOpen, saveCompleteDialogOpen]);

  useEffect(() => {
    if (!loadGameConfirmOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      setLoadGameConfirmOpen(false);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [loadGameConfirmOpen]);

  useEffect(() => {
    if (!saveCompleteDialogOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      setSaveCompleteDialogOpen(false);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [saveCompleteDialogOpen]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const onDragStart = useCallback(
    (e: DragStartEvent) => {
      if (useGameStore.getState().dealAnimation) {
        setOverlayCards(null);
        return;
      }
      const g = useGameStore.getState().game;
      const d = e.active.data.current as
        | { type?: string; fromColumn?: number; startIndex?: number }
        | undefined;
      if (!g || !d || d.type !== "tableau" || d.fromColumn === undefined || d.startIndex === undefined) {
        setOverlayCards(null);
        return;
      }
      const col = g.columns[d.fromColumn];
      if (!col) {
        setOverlayCards(null);
        return;
      }
      setOverlayCards(col.slice(d.startIndex));
    },
    [],
  );

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      const clearOverlay = () => setOverlayCards(null);
      /** Let destination mount with same `layoutId` as overlay before unmounting overlay (shared layout → foundation/tableau). */
      const clearOverlayAfterLayoutHandoff = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => clearOverlay());
        });
      };

      const d = e.active.data.current as
        | { type?: string; fromColumn?: number; startIndex?: number }
        | undefined;
      const over = e.over;
      if (!d || d.type !== "tableau" || d.fromColumn === undefined || d.startIndex === undefined || !over) {
        clearOverlay();
        return;
      }
      const overId = String(over.id);
      if (overId.startsWith("col-")) {
        const toCol = Number(overId.slice(4));
        if (!Number.isNaN(toCol)) {
          const ok = tryMoveTableau(d.fromColumn, d.startIndex, toCol);
          if (ok) clearOverlayAfterLayoutHandoff();
          else clearOverlay();
        } else clearOverlay();
        return;
      }
      if (overId.startsWith("foundation-")) {
        const g = useGameStore.getState().game;
        if (!g) {
          clearOverlay();
          return;
        }
        const col = g.columns[d.fromColumn]!;
        if (d.startIndex !== col.length - 1) {
          clearOverlay();
          return;
        }
        const fi = Number(overId.slice("foundation-".length)) as FoundationIndex;
        if (fi >= 0 && fi <= 7) {
          const ok = tryMoveToFoundation(d.fromColumn, fi);
          if (ok) clearOverlayAfterLayoutHandoff();
          else clearOverlay();
        } else clearOverlay();
        return;
      }
      clearOverlay();
    },
    [tryMoveTableau, tryMoveToFoundation],
  );

  const onDragCancel = useCallback(() => setOverlayCards(null), []);

  const canDeal = Boolean(game && canDealFromStock(game) && !dealAnimation);

  const effectiveGame = useMemo(() => {
    if (!game) return null;
    if (!dealAnimation) return game;
    if (dealAnimation.kind === "stock") {
      return applyDealEntriesProgress(game, dealAnimation.entries, dealAnimation.landedCount);
    }
    return applyInitialDealEntriesProgress(game, dealAnimation.entries, dealAnimation.landedCount);
  }, [game, dealAnimation]);

  const canCloudSave = Boolean(!bypass && isSupabaseConfigured() && effectiveGame);
  const canCloudLoad = Boolean(!bypass && isSupabaseConfigured());

  const openLoadGameConfirm = useCallback(() => {
    if (!canCloudLoad) return;
    if (useGameStore.getState().dealAnimation) return;
    clearError();
    setLoadGameConfirmOpen(true);
  }, [canCloudLoad, clearError]);

  const confirmLoadFromCloud = useCallback(async () => {
    if (!canCloudLoad) return;
    if (useGameStore.getState().dealAnimation) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const { data: authData, error: authErr } = await client.auth.getUser();
    const user = authData.user;
    if (authErr || !user) return;
    setLoadGameConfirmOpen(false);
    clearError();
    setCloudLoadBusy(true);
    try {
      const cloud = await fetchSavedGame(client, user.id);
      if (!cloud) {
        useGameStore.setState({ lastError: "No saved game on the server." });
        return;
      }
      applyCloudBootstrap(cloud);
    } catch (e) {
      useGameStore.setState({
        lastError: e instanceof Error ? e.message : "Could not load from the server.",
      });
    } finally {
      setCloudLoadBusy(false);
    }
  }, [canCloudLoad, clearError, applyCloudBootstrap]);

  const saveToCloud = useCallback(async () => {
    if (!effectiveGame) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const { data: authData, error: authErr } = await client.auth.getUser();
    const user = authData.user;
    if (authErr || !user) return;
    setSaveCompleteDialogOpen(false);
    setCloudSaveBusy(true);
    try {
      await upsertSavedGame(client, user.id, effectiveGame);
      markCloudSaveComplete();
      setSaveCompleteDialogOpen(true);
    } catch {
      useGameStore.setState({
        lastError: "Could not save to the server. Check your connection and try again.",
      });
    } finally {
      setCloudSaveBusy(false);
    }
  }, [effectiveGame, markCloudSaveComplete]);

  const logout = useCallback(async () => {
    closeActionsMenu();
    setNavOpen(false);
    clearGameState();
    resetForLogout();
    if (!bypass) {
      await signOut();
      router.replace("/login");
    }
  }, [bypass, signOut, router, closeActionsMenu, resetForLogout]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey || !e.shiftKey || e.ctrlKey || e.metaKey) return;
      if (e.repeat) return;

      const t = e.target;
      if (t instanceof HTMLElement) {
        if (t.closest('[aria-modal="true"]')) return;
        if (isTextEntryElement(t)) return;
      }

      const { game, newGameOpen, endGameOpen, dealAnimation } = useGameStore.getState();
      if (newGameOpen || endGameOpen || loadGameConfirmOpen || saveCompleteDialogOpen) return;

      switch (e.code) {
        case "KeyN":
          e.preventDefault();
          e.stopPropagation();
          openNewGame();
          closeActionsMenu();
          break;
        case "KeyA":
          if (!game) return;
          e.preventDefault();
          e.stopPropagation();
          restart();
          closeActionsMenu();
          break;
        case "KeyS":
          if (!canCloudSave || cloudSaveBusy) return;
          e.preventDefault();
          e.stopPropagation();
          void saveToCloud();
          closeActionsMenu();
          break;
        case "KeyL":
          if (!canCloudLoad || cloudLoadBusy || dealAnimation) return;
          e.preventDefault();
          e.stopPropagation();
          openLoadGameConfirm();
          closeActionsMenu();
          break;
        case "KeyE":
          if (!game) return;
          e.preventDefault();
          e.stopPropagation();
          openEndGame();
          closeActionsMenu();
          break;
        case "KeyO":
          if (bypass) return;
          e.preventDefault();
          e.stopPropagation();
          void logout();
          closeActionsMenu();
          break;
        case "KeyU":
          if (!game) return;
          e.preventDefault();
          e.stopPropagation();
          undoMove();
          closeActionsMenu();
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [
    openNewGame,
    restart,
    openEndGame,
    undoMove,
    closeActionsMenu,
    canCloudSave,
    cloudSaveBusy,
    saveToCloud,
    canCloudLoad,
    cloudLoadBusy,
    openLoadGameConfirm,
    loadGameConfirmOpen,
    bypass,
    logout,
    saveCompleteDialogOpen,
  ]);

  return (
    <div
      className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--fg)]"
      style={{ ["--bg" as string]: colors.background, ["--fg" as string]: colors.text }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={collision}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <LayoutGroup id="game-board">
          <div
            className="sticky top-0 z-40 shrink-0 border-b border-black/25 shadow-[0_6px_16px_rgba(0,0,0,0.28)]"
            style={{ backgroundColor: colors.background }}
          >
          <header
            className="flex items-center justify-between gap-3 border-b border-black/20 px-2 py-2"
            style={{ backgroundColor: colors.titleBar }}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                className="shrink-0 cursor-pointer rounded p-2 text-emerald-200/80 hover:bg-white/10"
                aria-label="Open navigation menu"
                aria-expanded={navOpen}
                aria-controls="app-nav-drawer"
                onClick={() => setNavOpen((o) => !o)}
              >
                ☰
              </button>
              <h1 className="truncate text-sm font-semibold tracking-[0.18em] text-emerald-50">WILD SPIDER</h1>
            </div>
            <div className="flex min-w-0 shrink-0 items-center gap-2">
              {titleBarUserLabel ? (
                <span
                  className="max-w-[min(40vw,11rem)] truncate text-right text-xs text-emerald-100/80"
                  title={titleBarUserLabel}
                  data-testid="title-bar-user"
                >
                  {titleBarUserLabel}
                </span>
              ) : null}
              <details
                ref={actionsMenuRef}
                className="relative shrink-0"
                onToggle={(e) => setActionsMenuOpen(e.currentTarget.open)}
              >
              <summary
                data-testid="actions-menu-trigger"
                className="cursor-pointer list-none rounded px-3 py-1 text-xs text-emerald-100/90 hover:bg-white/10 [&::-webkit-details-marker]:hidden"
              >
                Actions ▾
              </summary>
              <ul
                className="absolute right-0 z-20 mt-1 min-w-[15rem] rounded-md border border-white/15 bg-zinc-900 py-1 text-sm shadow-lg"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("button")) {
                    closeActionsMenu();
                  }
                }}
              >
                <li>
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left hover:bg-white/10"
                    aria-keyshortcuts={ACTION_MENU_CHORDS.newGame}
                    onClick={openNewGame}
                  >
                    <span>New Game</span>
                    <span className="shrink-0 text-[10px] text-zinc-500">{ACTION_MENU_CHORDS.newGame}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    disabled={!game}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left hover:bg-white/10 disabled:cursor-not-allowed disabled:text-zinc-600"
                    aria-keyshortcuts={ACTION_MENU_CHORDS.restart}
                    onClick={restart}
                  >
                    <span>Restart Game</span>
                    <span className="shrink-0 text-[10px] text-zinc-500">{ACTION_MENU_CHORDS.restart}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    disabled={!canCloudSave || cloudSaveBusy}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left hover:bg-white/10 disabled:cursor-not-allowed disabled:text-zinc-600"
                    aria-keyshortcuts={ACTION_MENU_CHORDS.save}
                    onClick={() => {
                      void saveToCloud();
                      closeActionsMenu();
                    }}
                  >
                    <span>{cloudSaveBusy ? "Saving…" : "Save Game"}</span>
                    <span className="shrink-0 text-[10px] text-zinc-500">{ACTION_MENU_CHORDS.save}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    disabled={!canCloudLoad || cloudLoadBusy || Boolean(dealAnimation) || loadGameConfirmOpen}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left hover:bg-white/10 disabled:cursor-not-allowed disabled:text-zinc-600"
                    aria-keyshortcuts={ACTION_MENU_CHORDS.loadGame}
                    onClick={() => {
                      openLoadGameConfirm();
                      closeActionsMenu();
                    }}
                  >
                    <span>Load Game</span>
                    <span className="shrink-0 text-[10px] text-zinc-500">{ACTION_MENU_CHORDS.loadGame}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    disabled={!game}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left hover:bg-white/10 disabled:cursor-not-allowed disabled:text-zinc-600"
                    aria-keyshortcuts={ACTION_MENU_CHORDS.endGame}
                    onClick={openEndGame}
                  >
                    <span>End Game</span>
                    <span className="shrink-0 text-[10px] text-zinc-500">{ACTION_MENU_CHORDS.endGame}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    disabled={bypass}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left hover:bg-white/10 disabled:cursor-not-allowed disabled:text-zinc-600"
                    aria-keyshortcuts={ACTION_MENU_CHORDS.logout}
                    onClick={() => void logout()}
                  >
                    <span>Logout</span>
                    <span className="shrink-0 text-[10px] text-zinc-500">{ACTION_MENU_CHORDS.logout}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    disabled={!game}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left hover:bg-white/10 disabled:cursor-not-allowed disabled:text-zinc-600"
                    aria-keyshortcuts={ACTION_MENU_CHORDS.undo}
                    onClick={undoMove}
                  >
                    <span>Undo</span>
                    <span className="shrink-0 text-[10px] text-zinc-500">{ACTION_MENU_CHORDS.undo}</span>
                  </button>
                </li>
              </ul>
            </details>
            </div>
          </header>

          {lastError ? (
            <div
              className="flex shrink-0 items-center justify-center gap-3 border-b border-red-900/40 bg-red-950/50 px-3 py-2 text-center text-xs text-red-100"
              role="status"
            >
              <span className="min-w-0 flex-1">{lastError}</span>
              <button
                type="button"
                className="shrink-0 cursor-pointer rounded border border-red-800/80 px-2 py-0.5 text-[11px] text-red-100 hover:bg-red-900/50"
                onClick={() => clearError()}
              >
                Dismiss
              </button>
            </div>
          ) : null}

          {effectiveGame ? (
            <GameBar
              game={effectiveGame}
              deferSeedDisplay={dealAnimation?.kind === "initial"}
            />
          ) : null}

          {effectiveGame ? (
            <div className="px-3 pb-3 pt-1">
              <div
                className="grid w-full items-start gap-x-2"
                style={{
                  // Equal left/right regions for shelf and stock; each at least shelfWidth, grow together.
                  gridTemplateColumns: `minmax(${dimensions.shelfWidth}px, 1fr) auto minmax(${dimensions.shelfWidth}px, 1fr)`,
                }}
              >
                <div className="flex min-w-0 justify-center">
                  <ShelfStrip game={effectiveGame} />
                </div>
                <div
                  className="flex min-w-0 justify-center"
                  style={{ paddingTop: dimensions.shelfVerticalPad }}
                >
                  <motion.div
                    key={sessionKey}
                    className="flex flex-wrap items-start justify-center"
                    style={{ gap: dimensions.columnSpacing }}
                    initial={{ opacity: 0.35, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: timings.cardDealDuration / 1000 }}
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <FoundationSlot key={i} game={effectiveGame} index={i as FoundationIndex} />
                    ))}
                  </motion.div>
                </div>
                <div
                  className="flex min-w-0 justify-center"
                  style={{ paddingTop: dimensions.shelfVerticalPad }}
                >
                  <StockPile
                    game={effectiveGame}
                    frozenUpcomingLeadCards={
                      dealAnimation?.kind === "stock" ? dealAnimation.frozenUpcomingLeadCards : undefined
                    }
                    initialDealRevealCount={
                      dealAnimation?.kind === "initial" ? dealAnimation.stockRevealDepth : undefined
                    }
                    onDeal={() => tryDeal()}
                    canDeal={canDeal}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {!game ? (
          <p className="p-6 text-sm text-emerald-100/75">
            No active game — start one from the New game dialog (opens automatically when nothing is saved in this
            browser).
          </p>
        ) : null}

        {effectiveGame ? (
          <div className="relative z-0 isolate flex flex-col gap-4 p-3">
            <div
              className="flex flex-wrap justify-center"
              style={{ gap: dimensions.columnSpacing }}
              data-testid="tableau-root"
            >
              {effectiveGame.columns.map((_, colIndex) => (
                <TableauColumn key={colIndex} game={effectiveGame} columnIndex={colIndex} />
              ))}
            </div>
          </div>
        ) : null}

        <DragOverlay dropAnimation={null}>
          {overlayCards && overlayCards.length > 0 ? (
            <div
              className="relative cursor-grabbing shadow-xl"
              style={{
                width: dimensions.cardWidth,
                height: (overlayCards.length - 1) * off + ch,
              }}
            >
              {overlayCards.map((placed, i) => (
                <motion.div
                  key={`${placed.card.kind}-${placed.card.id}-${i}`}
                  layoutId={cardLayoutId(placed.card)}
                  transition={layoutSpring}
                  className="absolute left-0 inline-block"
                  style={{ top: i * off, zIndex: i + 1 }}
                >
                  <CardView placed={placed} />
                </motion.div>
              ))}
            </div>
          ) : null}
        </DragOverlay>
        </LayoutGroup>
      </DndContext>

      <DealAnimationLayer />

      <NewGameDialog />
      <EndGameDialog />

      {loadGameConfirmOpen ? (
        <div
          className="fixed inset-0 z-[55] flex cursor-default items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="load-game-confirm-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLoadGameConfirmOpen(false);
          }}
        >
          <div
            className="w-full max-w-md cursor-default rounded-xl border border-white/15 bg-zinc-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="load-game-confirm-title" className="text-lg font-semibold text-zinc-100">
              Load game from server?
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              This replaces your current in-progress game with the save stored for your account. Unsaved local
              changes since your last successful server save will be lost.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLoadGameConfirmOpen(false)}
                className="cursor-pointer rounded border border-white/20 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmLoadFromCloud()}
                className="cursor-pointer rounded bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                data-testid="load-game-confirm"
              >
                Load
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {cloudLoadBusy ? <CloudBusyOverlay label="Loading from server…" ariaLabel="Loading game from server" /> : null}

      {cloudSaveBusy ? <CloudBusyOverlay label="Saving to server…" ariaLabel="Saving game to server" /> : null}

      {saveCompleteDialogOpen ? (
        <div
          className="fixed inset-0 z-[110] flex cursor-default items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-complete-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSaveCompleteDialogOpen(false);
          }}
        >
          <div
            className="w-full max-w-md cursor-default rounded-xl border border-white/15 bg-zinc-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="save-complete-title" className="text-lg font-semibold text-zinc-100">
              Save complete
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              Your in-progress game was saved to the server. You can load it again anytime from this device or after
              signing in elsewhere.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSaveCompleteDialogOpen(false)}
                className="cursor-pointer rounded bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {navOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-50 cursor-default bg-black/50"
            aria-label="Close navigation menu"
            onClick={() => setNavOpen(false)}
          />
          <nav
            id="app-nav-drawer"
            className="fixed left-0 top-0 z-[60] flex h-full w-[min(18rem,88vw)] flex-col gap-1 border-r border-white/10 bg-zinc-950 py-4 pl-4 pr-3 shadow-2xl"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Navigate</p>
            <ul className="mt-2 flex flex-col gap-0.5 text-sm">
              {(
                [
                  { href: "/", label: "Game" },
                  { href: "/achievements", label: "Achievements" },
                  { href: "/decks", label: "Decks" },
                  { href: "/hof", label: "Hall of Fame" },
                  { href: "/settings", label: "Settings" },
                ] as const
              ).map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`block rounded px-3 py-2 hover:bg-white/10 ${active ? "bg-white/10 text-emerald-100" : "text-zinc-200"}`}
                      onClick={() => setNavOpen(false)}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      ) : null}
    </div>
  );
}
