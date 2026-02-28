# opencode-plugin-nono

![AI Slop](https://img.shields.io/badge/AI-Slop-orange)

OpenCode plugin that integrates [nono](https://nono.sh) sandbox context and guidance into your AI agent sessions. This is the OpenCode equivalent of the [built-in Claude Code hook](https://github.com/always-further/nono/blob/main/crates/nono-cli/data/hooks/nono-hook.sh) that nono provides for Claude.

## What it does

With this plugin, when you run OpenCode inside the nono sandbox:

1. **Knows your sandbox limits** - The agent sees which paths are allowed and whether network access is blocked
2. **Gets clear guidance on denials** - When a tool fails due to sandbox restrictions, the agent is told immediately that it's a hard boundary and how to fix it (restart with `--allow`)
3. **Stops wasting time on workarounds** - No more trying alternative paths, copying files, or suggesting manual steps. The agent tells you to restart nono with the needed permissions

## Quick Start

Add to your `opencode.json`:

```json
{
  "plugins": ["@fix-fix/opencode-plugin-nono@latest"]
}
```

Run OpenCode inside nono:

```bash
nono run --profile opencode -- opencode
```

Then on encountering an access error the agent won't try to work around it
and instead will suggest a solution:

```bash
nono run --profile opencode -- opencode run 'Show the content of ~/.env file'

✗ read failed
Error: EACCES: permission denied, open '/home/username/.env'

The `~/.env` file is not accessible in the current nono sandbox session due to permission restrictions. The sandbox only allows access to specific directories in your home folder, and `~/.env` is not among them.

**To access this file, you would need to exit and restart the session with:**
nono run --allow ~/.env -- opencode
```

## Requirements

- [nono](https://nono.sh)

The plugin detects automatically when running under nono (via `$NONO_CAP_FILE`).
If not running under nono, it does nothing.

## Supported tools

Denial detection works for: `bash`, `read`, `write`, `edit`, `patch`, `glob`, `grep`, `list`.

## License

MIT
