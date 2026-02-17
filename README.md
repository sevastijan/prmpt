<div align="center">

# prmpt

**Prompt library for Claude Code**

Save, organize, version, share and reuse prompts — from [prmpt.space](https://prmpt.space)

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Claude Code Plugin](https://img.shields.io/badge/Claude_Code-plugin-D97706)](https://claude.ai)

---

**[Install](#install)** &middot; **[Features](#features)** &middot; **[Commands](#commands)** &middot; **[API](#api)** &middot; **[MCP](#mcp-server)** &middot; **[Teams](#teams)**

[prmpt.space](https://prmpt.space)

</div>

---

## How it works

```
  You (Claude Code)           prmpt server            Browser UI
 ┌────────────────┐      ┌────────────────────┐    ┌──────────────┐
 │  /prmpt:init   │─────▶│  Pairing code      │◀───│  Authorize   │
 │                │◀─────│  Token issued      │    │              │
 │  /prmpt:browse │─────▶│  GET /api/prompts  │    │  Manage      │
 │                │◀─────│  Prompt content    │    │  prompts     │
 │  Execute       │      │                    │    │              │
 └────────────────┘      └────────────────────┘    └──────────────┘
```

Write prompts in the browser. Use them from the CLI. Share with your team.

---

## Install

### 1. Add marketplace & install plugin

```bash
/plugin marketplace add sevastijan/prmpt
/plugin install prmpt@prmpt-marketplace
```

### 2. Connect your account

```
/prmpt:init
```

Opens [prmpt.space](https://prmpt.space) in your browser — register, click **Authorize**, done.

### 3. Use prompts

```
/prmpt:browse               # browse all prompts
/prmpt:browse coding        # filter by category
```

Select a prompt, fill in variables, and it executes immediately.

---

## Features

### Prompt Management
- **Create & edit** prompts with rich content
- **Categories** — organize prompts into groups
- **Version history** — every edit creates an immutable snapshot
- **Template variables** — use `{{variable}}` syntax for dynamic prompts

### Library & Sharing
- **Share prompts** — mark as public for all users on your server
- **Star** your favorites for quick access
- **Fork** — copy any shared prompt to your personal library
- **Search** by name, description, or category

### Teams
- **Team workspaces** — shared prompts and categories
- **Invite members** via shareable links (7-day expiry)
- **Role-based access** — Owner and Member roles
- **Context switching** — toggle between personal and team libraries

### Two integration methods
- **Plugin commands** — `/prmpt:init` and `/prmpt:browse` work directly in Claude Code
- **MCP server** — native integration with `list_prompts`, `get_prompt`, `use_prompt`

---

## Commands

| Command | Description |
|---------|-------------|
| `/prmpt:init` | Connect plugin to your account via browser authorization |
| `/prmpt:browse` | Browse all prompts and execute selected one |
| `/prmpt:browse [category]` | Browse prompts filtered by category |

### What happens when you browse

1. Fetches your prompts from the server
2. Shows categories or prompts as selectable options
3. You pick a prompt
4. If it has `{{variables}}`, you're asked to fill them in
5. The final prompt is executed immediately in your current context

---

## API

Base URL: `https://prmpt.space`

Auth: session cookie (browser) or `?token=YOUR_TOKEN` (CLI/API).

### Prompts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/prompts` | List prompts (add `?teamId=...` for team) |
| `POST` | `/api/prompts` | Create prompt |
| `GET` | `/api/prompts/[id]` | Get single prompt |
| `PUT` | `/api/prompts/[id]` | Update prompt (creates version) |
| `DELETE` | `/api/prompts/[id]` | Delete prompt |
| `GET` | `/api/prompts/[id]/versions` | Version history |

### Library

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/library` | Browse shared prompts (`?search=`, `?category=`, `?starred=true`) |
| `POST` | `/api/library/[id]/fork` | Fork a shared prompt |
| `POST` | `/api/library/[id]/star` | Toggle star |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/categories` | List categories with counts |
| `POST` | `/api/categories` | Create category |
| `PUT` | `/api/categories` | Rename category |
| `DELETE` | `/api/categories` | Delete category |

### Teams

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/teams` | List your teams |
| `POST` | `/api/teams` | Create team |
| `GET` | `/api/teams/[id]` | Team details + members |
| `POST` | `/api/teams/[id]/invitations` | Create invite link |
| `POST` | `/api/invitations/[token]/accept` | Accept invitation |

---

## MCP Server

Native Claude Code integration via Model Context Protocol.

### Setup

Add to your Claude Code MCP config:

```json
{
  "mcpServers": {
    "prmpt": {
      "command": "node",
      "args": ["path/to/prmpt/mcp/dist/index.js"],
      "env": {
        "PRMPT_API_URL": "https://prmpt.space/api/prompts?token=YOUR_TOKEN"
      }
    }
  }
}
```

### Available tools

| Tool | Description |
|------|-------------|
| `list_prompts(category?)` | List all prompts, optionally filtered by category |
| `get_prompt(slug)` | Get a single prompt by slug or name |
| `use_prompt(slug, variables?)` | Get prompt with `{{variables}}` filled in |
| `list_categories()` | List categories with prompt counts |

---

## Teams

Teams allow shared prompt libraries for your organization.

### Free tier
- Up to **2 members** per team — no payment required

### Paid tier (requires Stripe config)
- **$2/month per member** above the free 2
- Managed via Stripe checkout
- Subscription status tracked automatically

### Invitations

Team owners can generate invite links:

```
https://prmpt.space/invitations/abc123
```

Links expire after 7 days. Recipients must have an account to accept.

---

## Security

- Passwords hashed with bcrypt (12 rounds)
- API tokens auto-generated (CUID)
- Pairing codes expire in 10 minutes
- Invitation links expire in 7 days
- No passwords sent to CLI — pairing code flow only

---

<div align="center">

MIT License

Built for [Claude Code](https://claude.ai)

</div>
