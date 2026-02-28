import { readFileSync } from "node:fs";
import type { NonoCapabilities, NonoCapabilityFile, NonoFsEntry } from "./types.js";

export function loadCapabilities(envVar: string = "NONO_CAP_FILE"): NonoCapabilities {
  const capFilePath = process.env[envVar];

  if (!capFilePath) {
    return createEmptyCapabilities();
  }

  try {
    const content = readFileSync(capFilePath, "utf-8");
    const parsed = JSON.parse(content) as NonoCapabilityFile;

    if (!Array.isArray(parsed.fs)) {
      return createEmptyCapabilities();
    }

    return {
      loaded: true,
      fs: normalizeFsEntries(parsed.fs),
      netBlocked: parsed.net_blocked ?? false,
      workdir: parsed.workdir
    };
  } catch {
    return createEmptyCapabilities();
  }
}

function createEmptyCapabilities(): NonoCapabilities {
  return {
    loaded: false,
    fs: [],
    netBlocked: false
  };
}

function normalizeFsEntries(entries: unknown): NonoFsEntry[] {
  if (!Array.isArray(entries)) return [];

  const result: NonoFsEntry[] = [];

  for (const entry of entries) {
    if (
      entry &&
      typeof entry === "object" &&
      "path" in entry &&
      typeof entry.path === "string" &&
      "access" in entry &&
      typeof entry.access === "string" &&
      ["read", "write", "readwrite"].includes(entry.access)
    ) {
      result.push({
        path: entry.path,
        access: entry.access as "read" | "write" | "readwrite"
      });
    }
  }

  return result;
}

export function formatCapabilitiesSummary(caps: NonoCapabilities): string {
  if (!caps.loaded) {
    return "Not running under nono sandbox (no capability file found)";
  }

  const lines: string[] = ["nono sandbox active:"];

  if (caps.fs.length > 0) {
    const readPaths = caps.fs
      .filter(e => e.access === "read" || e.access === "readwrite")
      .map(e => e.path);
    const writePaths = caps.fs
      .filter(e => e.access === "write" || e.access === "readwrite")
      .map(e => e.path);

    if (readPaths.length > 0) {
      lines.push(`  allowed (read): ${readPaths.join(", ")}`);
    }
    if (writePaths.length > 0) {
      lines.push(`  allowed (write): ${writePaths.join(", ")}`);
    }
  } else {
    lines.push("  no filesystem access allowed");
  }

  lines.push(`  network: ${caps.netBlocked ? "blocked" : "allowed"}`);

  if (caps.workdir) {
    lines.push(`  workdir: ${caps.workdir.path} [${caps.workdir.access}]`);
  }

  return lines.join("\n");
}

export function formatCapabilitiesJson(caps: NonoCapabilities): string {
  return JSON.stringify(caps, null, 2);
}
