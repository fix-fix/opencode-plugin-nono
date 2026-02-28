import { describe, it, expect } from "vitest";
import { classifyDenial, isBashFailure } from "../src/deny-classifier.js";
import type { NonoCapabilities } from "../src/types.js";

const mockCapabilities: NonoCapabilities = {
  loaded: true,
  fs: [
    { path: "/home/user", access: "readwrite" },
    { path: "/tmp", access: "read" },
  ],
  netBlocked: true,
};

describe("deny-classifier", () => {
  describe("isBashFailure", () => {
    it("returns true for non-zero exit code (number)", () => {
      expect(isBashFailure(1, "")).toBe(true);
      expect(isBashFailure(126, "")).toBe(true);
    });

    it("returns true for non-zero exit code (string)", () => {
      expect(isBashFailure("1", "")).toBe(true);
      expect(isBashFailure("126", "")).toBe(true);
    });

    it("returns false for zero exit code", () => {
      expect(isBashFailure(0, "")).toBe(false);
      expect(isBashFailure("0", "")).toBe(false);
    });

    it("returns false for null/undefined exit code", () => {
      expect(isBashFailure(null, "")).toBe(false);
      expect(isBashFailure(undefined, "")).toBe(false);
    });
  });

  describe("classifyDenial", () => {
    it("returns not denied for normal output", () => {
      const result = classifyDenial("Hello world", "bash", mockCapabilities);
      expect(result.isDenied).toBe(false);
    });

    it("detects EACCES permission denied", () => {
      const result = classifyDenial("bash: /etc/passwd: Permission denied (EACCES)", "bash", mockCapabilities);
      expect(result.isDenied).toBe(true);
      expect(result.suggestion).toContain("ALLOWED PATHS");
    });

    it("detects EPERM", () => {
      const result = classifyDenial("Operation not permitted (EPERM)", "bash", mockCapabilities);
      expect(result.isDenied).toBe(true);
    });

    it("detects sandbox denial", () => {
      const result = classifyDenial("sandbox blocked this operation", "bash", mockCapabilities);
      expect(result.isDenied).toBe(true);
    });

    it("includes suggestion with allowed paths", () => {
      const result = classifyDenial("EACCES", "bash", mockCapabilities);
      expect(result.suggestion).toContain("/home/user");
      expect(result.suggestion).toContain("nono run --allow");
    });

    it("handles non-bash tools", () => {
      const result = classifyDenial("permission denied", "read", mockCapabilities);
      expect(result.isDenied).toBe(true);
    });

    it("handles missing capabilities", () => {
      const caps: NonoCapabilities = { loaded: false, fs: [], netBlocked: false };
      const result = classifyDenial("EACCES", "bash", caps);
      expect(result.isDenied).toBe(true);
      expect(result.suggestion).toContain("unknown");
    });
  });
});
