# Claude Code Configuration

This directory contains project-specific settings for Claude Code.

## MCP Servers

### Playwright MCP
Browser automation server for visual testing, screenshots, and web interactions.

**Capabilities:**
- Take screenshots of web pages
- Automate browser interactions
- Test responsive designs
- Capture visual regressions

**Installation:**
Installed via: `claude mcp add playwright npx @playwright/mcp@latest`

**Configuration:**
See [settings.json](./settings.json) for the full MCP server configuration.

**Documentation:**
- [Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp)
- [Playwright Documentation](https://playwright.dev)

## Project Settings

### Permissions
- `allowedTools`: Tools that Claude can use without asking permission
- `ignorePatterns`: File patterns to exclude from search and context

### File Organization
```
.claude/
├── settings.json    # Project-wide Claude Code settings
├── README.md        # This file
└── commands/        # Custom slash commands (future)
```

## Best Practices

1. **Keep settings.json clean**: Only add configuration that's project-specific
2. **Document MCP servers**: Add descriptions for each server in settings.json
3. **Version control**: Commit .claude/settings.json to share team configuration
4. **Security**: Never commit API keys or secrets in settings.json
