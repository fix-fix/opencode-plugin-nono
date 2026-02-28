import type { NonoCapabilities } from "./types.js";

const DENIAL_PATTERNS = [
  /EACCES/,
  /EPERM/,
  /permission denied/i,
  /operation not permitted/i,
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
      ? capabilities.fs.map((e) => `  ${e.path} (${e.access})`).join("\n")
      : "  (none)";

  const netStatus = capabilities.loaded
    ? capabilities.netBlocked
      ? "blocked"
      : "allowed"
    : "unknown";

  return {
    isDenied: true,
    reason: `Operation denied: matched pattern "${matchedPattern.source}"`,
    suggestion: `[NONO SANDBOX - PERMISSION DENIED]

STOP. Do not try alternative approaches. This is a hard security boundary.

You are running inside the nono security sandbox. The operation you just attempted is PERMANENTLY BLOCKED for this session. There is NO workaround possible from inside this session.

ALLOWED PATHS (everything else is blocked):
${allowedPaths}
Network: ${netStatus}

FORBIDDEN ACTIONS - DO NOT ATTEMPT:
- Trying alternative file paths
- Copying files to allowed locations
- Using sudo or changing permissions
- Suggesting the user run commands manually
- Any other workaround

REQUIRED ACTION:
Tell the user they must EXIT this session and restart with the needed path:

  nono run --allow /path/to/needed -- opencode

This is the ONLY solution. The sandbox cannot be modified from within.`,
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
