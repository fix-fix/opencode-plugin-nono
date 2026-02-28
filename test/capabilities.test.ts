import { describe, it, expect } from "vitest";
import { loadCapabilities, formatCapabilitiesSummary, formatCapabilitiesJson } from "../src/capabilities.js";
import type { NonoCapabilities } from "../src/types.js";

describe("capabilities", () => {
  describe("loadCapabilities", () => {
    it("returns empty capabilities when NONO_CAP_FILE is not set", () => {
      const result = loadCapabilities("NONO_CAP_FILE_DOES_NOT_EXIST");
      expect(result.loaded).toBe(false);
      expect(result.fs).toEqual([]);
    });
  });

  describe("formatCapabilitiesSummary", () => {
    it("returns 'not active' when not loaded", () => {
      const caps: NonoCapabilities = { loaded: false, fs: [], netBlocked: true };
      const result = formatCapabilitiesSummary(caps);
      expect(result).toContain("no capability file found");
    });

    it("shows fs paths when loaded", () => {
      const caps: NonoCapabilities = {
        loaded: true,
        fs: [
          { path: "/home/user", access: "readwrite" },
          { path: "/tmp", access: "read" },
        ],
        netBlocked: false,
      };
      const result = formatCapabilitiesSummary(caps);
      expect(result).toContain("/home/user");
      expect(result).toContain("allowed (read)");
    });

    it("shows network status", () => {
      const caps: NonoCapabilities = { loaded: true, fs: [], netBlocked: true };
      const result = formatCapabilitiesSummary(caps);
      expect(result).toContain("network:");
    });

    it("shows workdir when present", () => {
      const caps: NonoCapabilities = {
        loaded: true,
        fs: [],
        netBlocked: false,
        workdir: { path: "/project", access: "readwrite" },
      };
      const result = formatCapabilitiesSummary(caps);
      expect(result).toContain("/project");
      expect(result).toContain("readwrite");
    });
  });

  describe("formatCapabilitiesJson", () => {
    it("returns JSON string", () => {
      const caps: NonoCapabilities = { loaded: true, fs: [], netBlocked: false };
      const result = formatCapabilitiesJson(caps);
      expect(() => JSON.parse(result)).not.toThrow();
    });
  });
});
