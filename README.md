# testbay-mcp

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](package.json)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-6366f1)](https://modelcontextprotocol.io)

Standalone **Model Context Protocol** server for [Testbay](https://testbay.dev) — the marketplace where developers fund real people to test websites and iOS TestFlight apps.

This package is a thin, open-source client: it calls the public Testbay REST API and exposes four typed tools over **stdio**. No database keys, Supabase URLs or server secrets ship in the npm package.

## Quick start

```bash
npx -y testbay-mcp
```

Or from this repository:

```bash
cd testbay-mcp
npm ci && npm run build
node dist/index.js
```

### Environment

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `TESTBAY_API_KEY` | Yes (all tools) | — | Developer Bearer token from Testbay |
| `TESTBAY_API_URL` | No | `https://testbay.dev/api` | REST API base URL |

## 1-minute client setup

### Cursor (`~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "testbay": {
      "command": "npx",
      "args": ["-y", "testbay-mcp"],
      "env": {
        "TESTBAY_API_KEY": "YOUR_TESTBAY_API_KEY"
      }
    }
  }
}
```

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "testbay": {
      "command": "npx",
      "args": ["-y", "testbay-mcp"],
      "env": {
        "TESTBAY_API_KEY": "YOUR_TESTBAY_API_KEY"
      }
    }
  }
}
```

Restart the client after changing configuration.

### Claude Code

```bash
claude mcp add testbay -- npx -y testbay-mcp
export TESTBAY_API_KEY="YOUR_TESTBAY_API_KEY"
```

Or add the same `mcpServers` block to your Claude Code MCP settings file with `env.TESTBAY_API_KEY`.

## Tools

| Tool | Description |
| --- | --- |
| `list_tests` | Your draft, active (live) and completed test listings |
| `create_test_draft` | Unpaid draft with reward, platform, requirements and slots |
| `get_test_feedback` | Tester answers, ratings in responses, voice timestamps and screen captures |
| `get_account_summary` | Account status, wallet credits and publisher profile |

### `list_tests`

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `limit` | integer | `25` | Max tests per group (draft / active / completed) |

### `create_test_draft`

| Parameter | Type | Description |
| --- | --- | --- |
| `title` | string | Short title (1–120 chars) |
| `description` | string | Product summary |
| `what_to_test` | string | Focus areas |
| `instructions` | string | Steps for testers |
| `platform` | `"web"` \| `"ios"` | Target platform |
| `link` | string (https) | Site URL or TestFlight join link |
| `reward_cents` | integer | USD cents per tester |
| `max_testers` | integer | Slot count |
| `est_minutes` | integer | Estimated duration (default `15`) |

### `get_test_feedback`

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `test_id` | UUID | — | Test to read |
| `limit` | integer | `25` | Sessions per page |
| `offset` | integer | `0` | Pagination offset |
| `only_approved` | boolean | `false` | Only reviewed feedback |

### `get_account_summary`

No parameters.

## Development

```bash
npm run build
npm test
```

Tool responses are JSON text in MCP `content`. Failures set `isError: true` with a stable `error.code`.

## Smithery

[`smithery.yaml`](smithery.yaml) configures automatic build and security scanning on [Smithery.ai](https://smithery.ai).

## Directory listings

Publish this tree as the **standalone** repo [`LeoSprr/testbay-mcp`](https://github.com/LeoSprr/testbay-mcp) (not inside the main Testbay app repo). Then:

| Directory | What to do |
| --- | --- |
| [Smithery](https://smithery.ai) | Sign in with GitHub → connect `LeoSprr/testbay-mcp` (uses `smithery.yaml`). |
| [MCP Registry](https://registry.modelcontextprotocol.io) | Install the Go CLI: `brew install mcp-publisher` (not an npm package). Then `mcp-publisher login github` and `mcp-publisher publish`. Requires **npm publish** of `testbay-mcp` first (registry verifies package ownership). |
| [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) | PR adding a line in alphabetical order: `- [LeoSprr/testbay-mcp](https://github.com/LeoSprr/testbay-mcp) 📇 ☁️ 🏠 🍎 🪟 🐧 - Paid user-testing marketplace: list your tests, create drafts, read feedback and wallet via testbay.dev. \`npx -y testbay-mcp\`` |
| [mcp.so](https://mcp.so) | Submit form with the GitHub repo URL and install command `npx -y testbay-mcp`. |
| [Glama](https://glama.ai/mcp/servers) | On the public repo, set GitHub topics **`mcp`** and **`mcp-server`**; indexing is automatic within a few hours. |

After creating the GitHub repo, add topics: **mcp**, **mcp-server**, **testbay**, **model-context-protocol**.

## License

MIT — see [LICENSE](LICENSE).