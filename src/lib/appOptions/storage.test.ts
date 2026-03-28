import { describe, expect, it } from "vitest";
import { resolveLanguageId } from "../../numberLanguages";
import { userOptionsStorageKey } from "./shared";
import { loadStoredAppOptions } from "./storage";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function createStorage(rawValue: string | null): StorageLike {
  let storedValue = rawValue;

  return {
    getItem(key) {
      return key === userOptionsStorageKey ? storedValue : null;
    },
    setItem(key, value) {
      if (key === userOptionsStorageKey) {
        storedValue = value;
      }
    },
  };
}

describe("loadStoredAppOptions", () => {
  it("clamps invalid stored ranges and falls back to defaults", () => {
    const storage = createStorage(
      JSON.stringify({
        availableStart: -12,
        availableEnd: 99999,
        visibleStart: -8,
        visibleEnd: 99999,
        visibleRankStart: 0,
        visibleRankEnd: 99999,
        pointDisplayMode: "unknown",
        showEqualityLine: true,
      }),
    );

    expect(loadStoredAppOptions(storage)).toEqual({
      selectedLanguageIds: [resolveLanguageId("sv-SE")],
      availableRange: {
        start: 0,
        end: 5000,
      },
      visibleValueRange: {
        start: 0,
        end: 5000,
      },
      visibleRankRange: {
        start: 1,
        end: 5001,
      },
      pointDisplayMode: "auto",
      showEqualityLine: true,
    });
  });

  it("prefers normalized multi-select values and ignores invalid entries", () => {
    const storage = createStorage(
      JSON.stringify({
        selectedLanguageIds: ["en-US", "en", "missing-language"],
      }),
    );

    expect(loadStoredAppOptions(storage).selectedLanguageIds).toEqual([
      resolveLanguageId("en-US"),
    ]);
  });
});
