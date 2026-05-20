import { afterEach, describe, expect, it } from "vitest";
import {
  clearSkipCloudGameAutoload,
  peekSkipCloudGameAutoload,
  recordLogoutHadInProgressGame,
} from "./authSessionGameBootstrap";

describe("authSessionGameBootstrap", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("record false then peek is true until cleared", () => {
    recordLogoutHadInProgressGame(false);
    expect(peekSkipCloudGameAutoload()).toBe(true);
    expect(peekSkipCloudGameAutoload()).toBe(true);
    clearSkipCloudGameAutoload();
    expect(peekSkipCloudGameAutoload()).toBe(false);
  });

  it("record true removes skip flag", () => {
    recordLogoutHadInProgressGame(false);
    recordLogoutHadInProgressGame(true);
    expect(peekSkipCloudGameAutoload()).toBe(false);
  });
});
