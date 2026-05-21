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
  type DragCancelEvent,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { unstable_batchedUpdates as batchReactUpdates } from "react-dom";
import { LayoutGroup, motion } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import { NavDrawer } from "@/components/layout/NavDrawer";
import { CloudBusyOverlay } from "@/components/game/CloudBusyOverlay";
import { CardView } from "@/components/game/CardView";
import { DealAnimationLayer } from "@/components/game/DealAnimationLayer";
import { DeckPopup } from "@/components/game/DeckPopup";
import { EndGameDialog } from "@/components/game/EndGameDialog";
import { StockPopup } from "@/components/game/StockPopup";
import { FoundationSlot } from "@/components/game/FoundationSlot";
import { GameBar } from "@/components/game/GameBar";
import { NewGameDialog } from "@/components/game/NewGameDialog";
import { ShelfStrip } from "@/components/game/ShelfStrip";
import { StockPile } from "@/components/game/StockPile";
import { TableauColumn } from "@/components/game/TableauColumn";
import {
  TableauDragOverlayContext,
  type TableauDragOverlayContextValue,
} from "@/components/game/TableauDragOverlayContext";
import { colors } from "@/constants/colors";
import { dimensions, shelfFoundationStockStripMinHeightPx, tableauColumnStackHeightPx, tableauColumnStackTopPx, TABLEAU_DRAGGABLE_HOVER_SCALE } from "@/constants/dimensions";
import { timings } from "@/constants/timings";
import { applyDealEntriesProgress, canDealFromStock } from "@/engine/deal";
import { gameHasAnyCards } from "@/engine/setup";
import { applyInitialDealEntriesProgress } from "@/engine/initialDeal";
import type { FoundationIndex, PlacedCard } from "@/engine/types";
import { clearGameState } from "@/lib/gameStorage";
import { recordLogoutHadInProgressGame } from "@/lib/authSessionGameBootstrap";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchSavedGame, upsertSavedGame } from "@/lib/savedGamesRemote";
import { cardRevealedByTableauDrag, scheduleWarmCardFaceArt } from "@/lib/preloadPortraitArt";
import { POWER_TARGET_CURSOR_CLASS } from "@/lib/powerTargetUi";
import { useGameStore } from "@/state/gameStore";

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

const TABLEAU_LAYOUT_RETURN_BOOST_MS = timings.tableauLayoutReturnBoostMs;

export function GameShell() {
  const router = useRouter();
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
  const confirmSaveEnabled = useGameStore((s) => s.confirmSaveEnabled);
  const resetForLogout = useGameStore((s) => s.resetForLogout);
  const applyCloudBootstrap = useGameStore((s) => s.applyCloudBootstrap);
  const clearError = useGameStore((s) => s.clearError);
  const lastError = useGameStore((s) => s.lastError);
  const powerTargeting = useGameStore((s) => s.powerTargeting);
  const cancelPowerTargeting = useGameStore((s) => s.cancelPowerTargeting);

  const [overlayCards, setOverlayCards] = useState<readonly PlacedCard[] | null>(null);
  /** While set, only this draggable id keeps `useDraggable` during the drag (see `TableauColumn`). */
  const [activeTableauDragId, setActiveTableauDragId] = useState<string | null>(null);
  const [overlayApplyDragHoverScale, setOverlayApplyDragHoverScale] = useState(true);
  const [layoutBoostColumn, setLayoutBoostColumn] = useState<number | null>(null);
  const layoutBoostClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tableauScrollPaneRef = useRef<HTMLDivElement>(null);
  const [measuredTableauDropFloorBottomPx, setMeasuredTableauDropFloorBottomPx] = useState<number | null>(
    null,
  );

  const boostLayoutReturnForColumn = useCallback((column: number) => {
    if (layoutBoostClearTimeoutRef.current != null) {
      clearTimeout(layoutBoostClearTimeoutRef.current);
    }
    setLayoutBoostColumn(column);
    layoutBoostClearTimeoutRef.current = setTimeout(() => {
      setLayoutBoostColumn(null);
      layoutBoostClearTimeoutRef.current = null;
    }, TABLEAU_LAYOUT_RETURN_BOOST_MS);
  }, []);

  useEffect(
    () => () => {
      if (layoutBoostClearTimeoutRef.current != null) {
        clearTimeout(layoutBoostClearTimeoutRef.current);
      }
    },
    [],
  );

  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [cloudSaveBusy, setCloudSaveBusy] = useState(false);
  const [cloudLoadBusy, setCloudLoadBusy] = useState(false);
  const [loadGameConfirmOpen, setLoadGameConfirmOpen] = useState(false);
  const [saveGameConfirmOpen, setSaveGameConfirmOpen] = useState(false);
  const [saveCompleteDialogOpen, setSaveCompleteDialogOpen] = useState(false);
  const [deckPopupOpen, setDeckPopupOpen] = useState(false);
  const [stockPopupOpen, setStockPopupOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDetailsElement>(null);

  const closeActionsMenu = useCallback(() => {
    const el = actionsMenuRef.current;
    if (el) el.open = false;
  }, []);

  const closeDeckPopup = useCallback(() => setDeckPopupOpen(false), []);
  const closeStockPopup = useCallback(() => setStockPopupOpen(false), []);

  const openNewGameFromShell = useCallback(() => {
    closeDeckPopup();
    closeStockPopup();
    openNewGame();
  }, [closeDeckPopup, closeStockPopup, openNewGame]);

  const openEndGameFromShell = useCallback(() => {
    closeDeckPopup();
    closeStockPopup();
    openEndGame();
  }, [closeDeckPopup, closeStockPopup, openEndGame]);

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

  /** Escape cancels armed targeted power (no charge); popups handle their own Escape first. */
  useEffect(() => {
    if (!powerTargeting) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.repeat) return;
      const t = e.target;
      if (t instanceof HTMLElement && isTextEntryElement(t)) return;
      e.preventDefault();
      e.stopPropagation();
      cancelPowerTargeting();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [powerTargeting, cancelPowerTargeting]);

  /** Click outside valid targets cancels targeting (spec: invalid target). */
  useEffect(() => {
    if (!powerTargeting) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = e.target;
      if (!(el instanceof HTMLElement)) return;
      if (el.closest('[data-power-target-valid="true"]')) return;
      if (el.closest("[data-power-target-cancel-safe]")) return;
      cancelPowerTargeting();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [powerTargeting, cancelPowerTargeting]);

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
      if (useGameStore.getState().powerTargeting) return;
      const { dealAnimation, newGameOpen, endGameOpen } = useGameStore.getState();
      if (
        newGameOpen ||
        endGameOpen ||
        loadGameConfirmOpen ||
        saveGameConfirmOpen ||
        saveCompleteDialogOpen ||
        deckPopupOpen ||
        stockPopupOpen
      )
        return;
      if (!dealAnimation) return;
      e.preventDefault();
      e.stopPropagation();
      useGameStore.getState().skipDealAnimation();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [loadGameConfirmOpen, saveGameConfirmOpen, saveCompleteDialogOpen, deckPopupOpen, stockPopupOpen]);

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
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setSaveCompleteDialogOpen(false);
        return;
      }
      if (e.key !== "Enter" && e.code !== "NumpadEnter") return;
      if (e.repeat) return;
      const t = e.target;
      if (t instanceof HTMLElement && isTextEntryElement(t)) return;
      e.preventDefault();
      e.stopPropagation();
      setSaveCompleteDialogOpen(false);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [saveCompleteDialogOpen]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 0 },
    }),
  );

  const clearTableauDragSession = useCallback(() => {
    setActiveTableauDragId(null);
    setOverlayCards(null);
    setOverlayApplyDragHoverScale(true);
  }, []);

  const onDragStart = useCallback(
    (e: DragStartEvent) => {
      if (useGameStore.getState().powerTargeting) {
        clearTableauDragSession();
        return;
      }
      if (useGameStore.getState().dealAnimation) {
        clearTableauDragSession();
        return;
      }
      const g = useGameStore.getState().game;
      const d = e.active.data.current as
        | { type?: string; fromColumn?: number; startIndex?: number }
        | undefined;
      if (!g || !d || d.type !== "tableau" || d.fromColumn === undefined || d.startIndex === undefined) {
        clearTableauDragSession();
        return;
      }
      const col = g.columns[d.fromColumn];
      if (!col) {
        clearTableauDragSession();
        return;
      }
      setActiveTableauDragId(String(e.active.id));
      setOverlayApplyDragHoverScale(true);
      setOverlayCards(col.slice(d.startIndex));
      const reveal = cardRevealedByTableauDrag(g.columns, d.fromColumn, d.startIndex);
      if (reveal) scheduleWarmCardFaceArt(g.config.deckPairId, reveal);
    },
    [clearTableauDragSession],
  );

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      const clearOverlay = () => {
        clearTableauDragSession();
      };

      const d = e.active.data.current as
        | { type?: string; fromColumn?: number; startIndex?: number }
        | undefined;
      const over = e.over;

      if (!d || d.type !== "tableau" || d.fromColumn === undefined || d.startIndex === undefined) {
        clearOverlay();
        return;
      }
      const fromCol = d.fromColumn;
      const startIndex = d.startIndex;

      if (!over) {
        boostLayoutReturnForColumn(fromCol);
        clearOverlay();
        return;
      }

      const overId = String(over.id);
      if (overId.startsWith("col-")) {
        const toCol = Number(overId.slice(4));
        if (Number.isNaN(toCol)) {
          boostLayoutReturnForColumn(fromCol);
          clearOverlay();
          return;
        }
        let ok = false;
        batchReactUpdates(() => {
          ok = tryMoveTableau(fromCol, startIndex, toCol);
          if (ok) clearOverlay();
        });
        if (!ok) {
          boostLayoutReturnForColumn(fromCol);
          clearOverlay();
        }
        return;
      }
      if (overId.startsWith("foundation-")) {
        const g = useGameStore.getState().game;
        if (!g) {
          boostLayoutReturnForColumn(fromCol);
          clearOverlay();
          return;
        }
        const fi = Number(overId.slice("foundation-".length)) as FoundationIndex;
        if (fi < 0 || fi > 7) {
          boostLayoutReturnForColumn(fromCol);
          clearOverlay();
          return;
        }
        let ok = false;
        batchReactUpdates(() => {
          ok = tryMoveToFoundation(fromCol, startIndex, fi);
          if (ok) clearOverlay();
        });
        if (!ok) {
          boostLayoutReturnForColumn(fromCol);
          clearOverlay();
        }
        return;
      }
      boostLayoutReturnForColumn(fromCol);
      clearOverlay();
    },
    [tryMoveTableau, tryMoveToFoundation, boostLayoutReturnForColumn, clearTableauDragSession],
  );

  const onDragCancel = useCallback(
    (e: DragCancelEvent) => {
      const id = String(e.active.id);
      const m = /^t-(\d+)-\d+$/.exec(id);
      if (m) boostLayoutReturnForColumn(Number(m[1]));
      clearTableauDragSession();
    },
    [boostLayoutReturnForColumn, clearTableauDragSession],
  );

  const canDeal = Boolean(game && canDealFromStock(game) && !dealAnimation && !powerTargeting);

  const effectiveGame = useMemo(() => {
    if (!game) return null;
    if (!dealAnimation) return game;
    if (dealAnimation.kind === "stock") {
      return applyDealEntriesProgress(game, dealAnimation.entries, dealAnimation.landedCount);
    }
    return applyInitialDealEntriesProgress(game, dealAnimation.entries, dealAnimation.landedCount);
  }, [game, dealAnimation]);

  /** Stretch tableau column droppables to the bottom of the tableau scroll pane while a game is shown. */
  const applyTableauDropViewportFloorMinHeight = Boolean(effectiveGame);
  const tableauDropFloorBottomPx = applyTableauDropViewportFloorMinHeight
    ? measuredTableauDropFloorBottomPx
    : null;

  useLayoutEffect(() => {
    if (!applyTableauDropViewportFloorMinHeight) return;
    const pane = tableauScrollPaneRef.current;
    if (!pane) return;

    const sync = () => {
      const bottom = pane.getBoundingClientRect().bottom;
      setMeasuredTableauDropFloorBottomPx((prev) => (prev === bottom ? prev : bottom));
    };

    sync();

    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => sync());
      ro.observe(pane);
    }

    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [applyTableauDropViewportFloorMinHeight]);

  const tableauDragOverlayValue = useMemo(
    (): TableauDragOverlayContextValue => ({
      activeTableauDragId,
      layoutBoostColumn,
      applyTableauDropViewportFloorMinHeight,
      tableauDropFloorBottomPx,
    }),
    [
      activeTableauDragId,
      layoutBoostColumn,
      applyTableauDropViewportFloorMinHeight,
      tableauDropFloorBottomPx,
    ],
  );

  const canCloudSave = Boolean(
    !bypass && isSupabaseConfigured() && effectiveGame && gameHasAnyCards(effectiveGame),
  );
  const canCloudLoad = Boolean(!bypass && isSupabaseConfigured());

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
      setDeckPopupOpen(false);
      setStockPopupOpen(false);
    } catch (e) {
      useGameStore.setState({
        lastError: e instanceof Error ? e.message : "Could not load from the server.",
      });
    } finally {
      setCloudLoadBusy(false);
    }
  }, [canCloudLoad, clearError, applyCloudBootstrap]);

  const requestLoadGame = useCallback(() => {
    if (!canCloudLoad) return;
    if (useGameStore.getState().dealAnimation) return;
    clearError();
    if (effectiveGame && gameHasAnyCards(effectiveGame)) {
      setLoadGameConfirmOpen(true);
    } else {
      void confirmLoadFromCloud();
    }
  }, [canCloudLoad, clearError, effectiveGame, confirmLoadFromCloud]);

  const saveToCloud = useCallback(async () => {
    if (!effectiveGame) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;
    setSaveCompleteDialogOpen(false);
    setCloudSaveBusy(true);
    try {
      const { data: authData, error: authErr } = await client.auth.getUser();
      const user = authData.user;
      if (authErr || !user) return;
      await upsertSavedGame(client, user.id, effectiveGame);
      markCloudSaveComplete();
      setSaveCompleteDialogOpen(true);
    } catch (e) {
      useGameStore.setState({
        lastError:
          e instanceof Error
            ? e.message
            : "Could not save to the server. Check your connection and try again.",
      });
    } finally {
      setCloudSaveBusy(false);
    }
  }, [effectiveGame, markCloudSaveComplete]);

  const requestSaveGame = useCallback(() => {
    if (!canCloudSave || cloudSaveBusy) return;
    clearError();
    if (confirmSaveEnabled) {
      setSaveGameConfirmOpen(true);
    } else {
      void saveToCloud();
    }
  }, [canCloudSave, cloudSaveBusy, clearError, confirmSaveEnabled, saveToCloud]);

  const confirmSaveFromDialog = useCallback(() => {
    setSaveGameConfirmOpen(false);
    void saveToCloud();
  }, [saveToCloud]);

  useEffect(() => {
    if (!saveGameConfirmOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setSaveGameConfirmOpen(false);
        return;
      }
      if (e.key !== "Enter" && e.code !== "NumpadEnter") return;
      if (e.repeat) return;
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (isTextEntryElement(t)) return;
      if (t.closest("[data-save-game-confirm-cancel]")) return;
      e.preventDefault();
      e.stopPropagation();
      void confirmSaveFromDialog();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [saveGameConfirmOpen, confirmSaveFromDialog]);

  const logout = useCallback(async () => {
    closeActionsMenu();
    setNavOpen(false);
    setDeckPopupOpen(false);
    setStockPopupOpen(false);
    const { game: g } = useGameStore.getState();
    recordLogoutHadInProgressGame(Boolean(g && gameHasAnyCards(g)));
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
      if (newGameOpen || endGameOpen || loadGameConfirmOpen || saveGameConfirmOpen || saveCompleteDialogOpen) return;

      switch (e.code) {
        case "KeyN":
          e.preventDefault();
          e.stopPropagation();
          openNewGameFromShell();
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
          requestSaveGame();
          closeActionsMenu();
          break;
        case "KeyL":
          if (!canCloudLoad || cloudLoadBusy || dealAnimation) return;
          e.preventDefault();
          e.stopPropagation();
          requestLoadGame();
          closeActionsMenu();
          break;
        case "KeyE":
          if (!game || !gameHasAnyCards(game)) return;
          e.preventDefault();
          e.stopPropagation();
          openEndGameFromShell();
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
    openNewGameFromShell,
    restart,
    openEndGameFromShell,
    undoMove,
    closeActionsMenu,
    canCloudSave,
    cloudSaveBusy,
    requestSaveGame,
    canCloudLoad,
    cloudLoadBusy,
    requestLoadGame,
    loadGameConfirmOpen,
    saveGameConfirmOpen,
    bypass,
    logout,
    saveCompleteDialogOpen,
  ]);

  return (
    <div
      className="flex h-[100dvh] max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-[var(--bg)] text-[var(--fg)]"
      style={{ ["--bg" as string]: colors.background, ["--fg" as string]: colors.text }}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={collision}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <LayoutGroup id="game-board">
          <TableauDragOverlayContext.Provider value={tableauDragOverlayValue}>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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
              <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-emerald-50 sm:text-base">
                <span className="tracking-[0.14em]">WILD SPIDER</span>
                <span className="font-normal tracking-normal">: Game</span>
              </h1>
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
                    onClick={openNewGameFromShell}
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
                    disabled={!canCloudSave || cloudSaveBusy || loadGameConfirmOpen || saveGameConfirmOpen}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left hover:bg-white/10 disabled:cursor-not-allowed disabled:text-zinc-600"
                    aria-keyshortcuts={ACTION_MENU_CHORDS.save}
                    onClick={() => {
                      requestSaveGame();
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
                    disabled={!canCloudLoad || cloudLoadBusy || Boolean(dealAnimation) || loadGameConfirmOpen || saveGameConfirmOpen}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left hover:bg-white/10 disabled:cursor-not-allowed disabled:text-zinc-600"
                    aria-keyshortcuts={ACTION_MENU_CHORDS.loadGame}
                    onClick={() => {
                      requestLoadGame();
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
                    disabled={!game || !gameHasAnyCards(game)}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left hover:bg-white/10 disabled:cursor-not-allowed disabled:text-zinc-600"
                    aria-keyshortcuts={ACTION_MENU_CHORDS.endGame}
                    onClick={openEndGameFromShell}
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
              canOpenDeckPopup={gameHasAnyCards(effectiveGame)}
              onOpenDeck={() => {
                setStockPopupOpen(false);
                setDeckPopupOpen(true);
              }}
              openDeckOnPointerEnter={powerTargeting != null}
              canOpenStockPopup={gameHasAnyCards(effectiveGame)}
              onOpenStock={() => {
                setDeckPopupOpen(false);
                setStockPopupOpen(true);
              }}
              openStockOnPointerEnter={powerTargeting != null}
            />
          ) : null}

          {effectiveGame ? (
            <div
              className="px-3 pb-3 pt-1"
              style={{ minHeight: shelfFoundationStockStripMinHeightPx(effectiveGame.config.deals) }}
            >
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
                <motion.div
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
                </motion.div>
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

        <div
          ref={tableauScrollPaneRef}
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden"
          data-tableau-scroll-pane
        >
        {!game ? (
          <p className="p-6 text-sm text-emerald-100/75">
            No game loaded — use <strong className="text-emerald-100/90">New Game</strong> from the Actions menu.
          </p>
        ) : !gameHasAnyCards(game) ? (
          <p className="p-6 text-sm text-emerald-100/75">
            No cards in play — use <strong className="text-emerald-100/90">New Game</strong> or{" "}
            <strong className="text-emerald-100/90">Restart Game</strong> from the Actions menu when you are ready.
          </p>
        ) : null}

        {effectiveGame ? (
          <div className="relative z-0 isolate flex min-h-0 min-w-0 flex-1 flex-col gap-4 p-3">
            <div
              className={`flex min-h-0 min-w-0 flex-1 flex-wrap content-start justify-center ${
                powerTargeting ? POWER_TARGET_CURSOR_CLASS : ""
              }`}
              style={{ gap: dimensions.columnSpacing }}
              data-testid="tableau-root"
              data-power-target-mode={powerTargeting ? "true" : undefined}
            >
              {effectiveGame.columns.map((_, colIndex) => (
                <TableauColumn key={colIndex} game={effectiveGame} columnIndex={colIndex} />
              ))}
            </div>
          </div>
        ) : null}

        </div>
        </div>

          </TableauDragOverlayContext.Provider>
        </LayoutGroup>

        <DragOverlay dropAnimation={null}>
          {overlayCards && overlayCards.length > 0 ? (
            <div
              className="relative cursor-grabbing shadow-xl"
              style={{
                width: dimensions.cardWidth,
                height: tableauColumnStackHeightPx(overlayCards),
                willChange: "transform",
              }}
            >
              {overlayCards.map((placed, i) => (
                <div
                  key={`${placed.card.kind}-${placed.card.id}-${i}`}
                  className="absolute left-0 inline-block"
                  style={{ top: tableauColumnStackTopPx(overlayCards, i), zIndex: i + 1 }}
                >
                  <div
                    className="inline-block"
                    style={
                      overlayApplyDragHoverScale
                        ? {
                            transform: `scale(${TABLEAU_DRAGGABLE_HOVER_SCALE})`,
                            transformOrigin: "center center",
                          }
                        : undefined
                    }
                  >
                    <CardView placed={placed} />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </DragOverlay>
        </div>
      </DndContext>
      </div>

      <DealAnimationLayer />

      <NewGameDialog />
      <EndGameDialog />

      {effectiveGame && deckPopupOpen && gameHasAnyCards(effectiveGame) ? (
        <DeckPopup game={effectiveGame} open onClose={() => setDeckPopupOpen(false)} />
      ) : null}

      {effectiveGame && stockPopupOpen && gameHasAnyCards(effectiveGame) ? (
        <StockPopup game={effectiveGame} open onClose={() => setStockPopupOpen(false)} />
      ) : null}

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

      {saveGameConfirmOpen ? (
        <div
          className="fixed inset-0 z-[55] flex cursor-default items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-game-confirm-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSaveGameConfirmOpen(false);
          }}
        >
          <div
            className="w-full max-w-md cursor-default rounded-xl border border-white/15 bg-zinc-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="save-game-confirm-title" className="text-lg font-semibold text-zinc-100">
              Save game to server?
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              This overwrites the single in-progress save stored for your account with your current game (including
              full history). You can turn this confirmation off in Settings.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                data-save-game-confirm-cancel
                onClick={() => setSaveGameConfirmOpen(false)}
                className="cursor-pointer rounded border border-white/20 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmSaveFromDialog()}
                className="cursor-pointer rounded bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                data-testid="save-game-confirm"
              >
                Save
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

      <NavDrawer open={navOpen} onRequestClose={() => setNavOpen(false)} />
    </div>
  );
}
