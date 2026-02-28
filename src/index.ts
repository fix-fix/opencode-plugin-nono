import type { Plugin } from "@opencode-ai/plugin";
import {
  loadCapabilities,
  formatCapabilitiesSummary,
  formatCapabilitiesJson,
} from "./capabilities.js";
import { tool } from "@opencode-ai/plugin/tool";
import { classifyDenial, isBashFailure } from "./deny-classifier.js";

const capabilityFileEnvVar = "NONO_CAP_FILE";
const capabilities = loadCapabilities(capabilityFileEnvVar);

const nonoCapabilitiesTool = tool({
  description:
    "Show nono sandbox capabilities: allowed filesystem paths, network status, and workdir access.",
  args: {
    format: tool.schema.enum(["text", "json"]).optional().default("text"),
  },
  execute: async (args, _context) => {
    if (args.format === "json") {
      return formatCapabilitiesJson(capabilities);
    }
    return formatCapabilitiesSummary(capabilities);
  },
});

export const NonoPlugin: Plugin = async () => {
  if (!capabilities.loaded) {
    console.debug("[opencode-plugin-nono] Plugin is disabled (running outside of nono).")
    return {};
  }

  const summary = formatCapabilitiesSummary(capabilities);
  const sandboxNote = capabilities.loaded
    ? `[sandbox] ${summary.replace(/\n/g, " | ")}`
    : "[sandbox] not active";

  return {
    tool: {
      nono_capabilities: nonoCapabilitiesTool,
    },
    "tool.execute.after": async (input, output) => {
      const toolName = typeof input.tool === "string" ? input.tool : "";

      if (toolName === "bash") {
        const exitCode = output.metadata?.exit;
        const toolOutput = output.output;

        if (isBashFailure(exitCode, toolOutput)) {
          const classification = classifyDenial(
            toolOutput,
            toolName,
            capabilities,
          );
          if (classification.isDenied && classification.suggestion) {
            output.output = `${toolOutput}\n\n${classification.suggestion}`;
          }
        }
      }
    },
    "experimental.chat.system.transform": async (_input, output) => {
      const fsLines = capabilities.fs
        .map((e) => `  ${e.path} (${e.access})`)
        .join("\n");
      const netStatus = capabilities.netBlocked ? "blocked" : "allowed";

      const lines = [
        "## Nono Sandbox - CRITICAL",
        "",
        "**You are running inside the nono security sandbox.** This is a capability-based sandbox that CANNOT be bypassed or modified from within the session.",
        "",
        "### On ANY \"operation not permitted\" or \"EPERM\" error:",
        "",
        "**IMMEDIATELY tell the user:**",
        "> This path is not accessible in the current nono sandbox session. You need to exit and restart with:",
        "> `nono run --allow /path/to/needed -- opencode`",
        "",
        "**NEVER attempt:**",
        "- Alternative file paths or locations",
        "- Copying files to accessible directories",
        "- Using sudo or permission changes",
        "- Manual workarounds for the user to try",
        "- ANY other approach besides restarting nono",
        "",
        "Allowed paths:",
        fsLines || "  (none)",
        `Network: ${netStatus}`,
        "",
        "The sandbox is a hard security boundary. Once applied, it cannot be expanded. The ONLY solution is to restart the session with additional --allow flags.",
      ];
      output.system.push(...lines);
    },
  };
};
