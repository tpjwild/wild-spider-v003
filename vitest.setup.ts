import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

/** Node can inject a broken `localStorage` (e.g. `--localstorage-file` with no path); Vitest then sees setItem that does not persist. */
function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  } as Storage;
}

function installMemoryLocalStorageIfBroken(): void {
  const ls = globalThis.localStorage;
  if (!ls || typeof ls.setItem !== "function" || typeof ls.getItem !== "function") {
    Object.defineProperty(globalThis, "localStorage", {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
    return;
  }
  try {
    const k = "__vitest_localstorage_probe__";
    ls.setItem(k, "1");
    const ok = ls.getItem(k) === "1";
    ls.removeItem(k);
    if (!ok) throw new Error("localStorage probe mismatch");
  } catch {
    Object.defineProperty(globalThis, "localStorage", {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
  }
}

installMemoryLocalStorageIfBroken();

/** jsdom does not provide ResizeObserver (used by shelf/foundation row layout). */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = ResizeObserverStub as typeof ResizeObserver;
}

afterEach(() => {
  cleanup();
});
