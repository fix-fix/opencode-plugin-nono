# Implementation Details

## Architecture

The plugin consists of:

- `src/types.ts` - TypeScript interfaces for nono capability file schema
- `src/capabilities.ts` - Capability loading and formatting utilities
- `src/deny-classifier.ts` - Denial pattern detection logic
- `src/index.ts` - Main plugin entry point with OpenCode hooks

## Hooks Used

### 1. `experimental.chat.system.transform`

Injects sandbox context into the system prompt at session start. The injected content includes:

- Hard boundary warning that sandbox cannot be modified from within session
- List of allowed filesystem paths with access levels
- Network status (blocked/allowed)
- Explicit list of forbidden workarounds

### 2. `tool.execute.after`

Handles tool output processing after execution. For supported tools (`bash`, `read`, `write`, `edit`, `patch`, `glob`, `grep`, `list`):

- **bash**: Checks `output.metadata.exit` for non-zero exit codes
- **All tools**: Runs output through denial classifier

When denial is detected, appends structured guidance message to the tool output.

### 3. Custom Tool: `nono.capabilities`

Exposes sandbox state via tool. Supports two output formats:

- `text`: Human-readable summary
- `json`: Machine-friendly capability data

## Denial Classification

### Patterns

Two pattern sets in `src/deny-classifier.ts`:

**Access denial** (always triggers):
- `EACCES`, `EPERM`
- `permission denied`, `operation not permitted`
- `sandbox`, `access denied`, `cannot access`

**ENOENT** (triggers only when paired with access denial):
- `no such file or directory`, `ENOENT`

This prevents false positives on legitimate "file not found" errors.

### Guidance Message

When denial is detected, the message includes:

- Hard stop language ("STOP", "hard security boundary")
- Current allowed paths
- Network status
- Explicit forbidden actions list
- Required action: restart with `--allow` flag

## Capability File

The plugin reads `$NONO_CAP_FILE` (default environment variable). Expected schema:

```json
{
  "fs": [
    { "path": "/home/user", "access": "readwrite" }
  ],
  "net_blocked": true,
  "workdir": {
    "path": "/home/user",
    "access": "readwrite"
  }
}
```

Gracefully handles missing or malformed files (reports "not running under nono").

## Limitations

1. **Hard sandbox boundary** - Cannot grant access from within session
2. **Partial failure interception** - When tools throw early (before execution), `tool.execute.after` is skipped
3. **Pattern matching brittleness** - Relies on error string patterns; may miss non-English errors or unusual formats
4. **MCP/custom tools** - May emit different metadata formats not covered by current classifier

## Testing

Run tests:

```bash
npm test
```

Test coverage:

- `test/capabilities.test.ts` - Capability parsing, formatting
- `test/deny-classifier.test.ts` - Denial pattern detection, ENOENT logic
