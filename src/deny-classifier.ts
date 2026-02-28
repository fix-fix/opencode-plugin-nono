import type { NonoCapabilities } from "./types.js";

const DENIAL_PATTERNS = [
  /EACCES/,
  /EPERM/,
  /permission denied/,
  /operation not permitted/,
  /EPERM/,
  /sandbox/,
  /access denied/i,
  /cannot access/i,
  /no such file or directory/i,
];

export interface DenyClassification {
  isDenied: boolean;
  reason?: string;
  suggestion?: string;
}

export function classifyDenial(
  output: unknown,
  toolName: string,
  capabilities: NonoCapabilities
): DenyClassification {
  const outputStr = typeof output === "string" ? output : JSON.stringify(output);

  const matchedPattern = DENIAL_PATTERNS.find((pattern) =>
    pattern.test(outputStr)
  );

  if (!matchedPattern) {
    return { isDenied: false };
  }

  const allowedPaths =
    capabilities.loaded && capabilities.fs.length > 0
      ? capabilities.fs.map((e) => `${e.path} [${e.access}]`).join(", ")
      : "none";

  const netStatus = capabilities.loaded
    ? capabilities.netBlocked
      ? "blocked"
      : "allowed"
    : "unknown";

  return {
    isDenied: true,
    reason: `Operation denied: matched pattern "${matchedPattern.source}"`,
    suggestion: `Sandbox is active. Allowed paths: ${allowedPaths}. Network: ${netStatus}. To allow this operation, restart with: nono run --allow /path/to/needed -- opencode`,
  };
}

export function isBashFailure(
  exitCode: unknown,
  output: unknown
): boolean {
  if (typeof exitCode === "number" && exitCode !== 0) {
    return true;
  }
  if (typeof exitCode === "string" && exitCode !== "0") {
    return true;
  }
  return false;
}
