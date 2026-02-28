import type { Plugin } from "@opencode-ai/plugin";

export interface NonoPluginOptions {
  capabilityFileEnvVar?: string;
}

export default function nonoPlugin(options: NonoPluginOptions = {}): Plugin {
  const capabilityFileEnvVar = options.capabilityFileEnvVar ?? "NONO_CAP_FILE";

  return {
    name: "opencode-plugin-nono",
    async init() {
      return {
        "experimental.chat.system.transform": (input) => {
          const lines = [
            "Sandbox note:",
            `- nono capability file env var: ${capabilityFileEnvVar}`,
            "- if a tool is denied by sandbox, do not retry with workarounds",
            "- suggest restarting with expanded nono allowlist"
          ];

          return {
            system: `${input.system}\n\n${lines.join("\n")}`
          };
        }
      };
    }
  };
}
