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
      const lines = [
        "Sandbox:",
        `- ${sandboxNote}`,
        "- if a tool is denied by sandbox, do not retry with workarounds",
        "- suggest restarting with expanded nono allowlist (nono run --allow /path -- opencode)",
      ];
      output.system.push(...lines);
    },
  };
};
