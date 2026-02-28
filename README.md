# opencode-plugin-nono

OpenCode plugin that integrates [nono](https://nono.sh) sandbox context and guidance.

## Features

- **Capability introspection**: Exposes a `nono_capabilities` tool to query sandbox permissions
- **System prompt injection**: Injects sandbox status into the system prompt
- **Denial detection**: Enriches tool failure messages with actionable guidance when operations are blocked by the sandbox

## Installation

### Via npm (published package)

Add to your `opencode.json`:

```json
{
  "plugins": ["@fix-fix/opencode-plugin-nono@latest"]
}
```

## Usage

The plugin automatically:

1. Reads the nono capability file (default: `$NONO_CAP_FILE`)
2. Exposes a `nono_capabilities` tool for querying sandbox state
3. Injects sandbox context into the system prompt
4. Enriches denied tool outputs with guidance on how to proceed

### Tool: `nono_capabilities`

Query sandbox capabilities:

```
> Use nono_capabilities tool
```

Returns filesystem paths and access levels, network status, and workdir access.

### System Prompt

The plugin injects a note like:

```
Sandbox:
- [sandbox] nono sandbox active: allowed (read): /home/user, /tmp | network: allowed
- if a tool is denied by sandbox, do not retry with workarounds
- suggest restarting with expanded nono allowlist (nono run --allow /path -- opencode)
```

### Denial Handling

When a tool fails due to sandbox restrictions, the error message is enriched with:

- The matched denial pattern
- Currently allowed filesystem paths
- Network status
- A suggestion to restart with expanded permissions

## Development

```bash
# Install dependencies
npm install

# Type check
npm run typecheck

# Build
npm run build

# Run tests
npm test
```

## Limitations

- Sandbox boundaries are hard at runtime; the plugin cannot grant new access in-session
- Failure interception is partial because throws can bypass the `tool.execute.after` hook
- Error classification uses pattern matching and may not catch all denial cases
- MCP/custom tools may emit different metadata formats

## License

MIT
