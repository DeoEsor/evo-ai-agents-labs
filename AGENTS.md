# AGENTS.md

## Cursor Cloud specific instructions

This is a monorepo of 10 independent lab projects for the cloud.ru AI Agents platform. Each lab is self-contained with its own virtual environment and dependencies.

### Architecture overview

| Lab | Language | Package Manager | Run Command |
|-----|----------|----------------|-------------|
| lab1-mcp-finance-lab | Python 3.12 | uv | `uv run python src/server.py` (from lab1 root) |
| lab2-adk-agent | Python 3.12 | uv | `uv run python src/start_a2a.py` (requires LLM_API_KEY) |
| lab3-langchain-agent | Python 3.12 | uv | `uv run python src/start_a2a.py` (requires LLM_API_KEY) |
| lab4-smolagents-agent | Python 3.12 | uv | `uv run python src/start_a2a.py` (requires LLM_API_KEY) |
| lab5-crewai-agent | Python 3.12 | uv | `uv run python src/start_a2a.py` (requires LLM_API_KEY) |
| lab6-strands-agent | Python 3.12 | uv | `uv run python src/start_a2a.py` (requires LLM_API_KEY) |
| lab7-mattermost-bot-for-agents | Python 3.10+ | uv | `uv run python bot.py` (requires MATTERMOST_URL, MATTERMOST_TOKEN) |
| lab8-telegram-bot-for-agents | Python 3.12 | uv | `uv run python main.py` (requires TELEGRAM_BOT_TOKEN) |
| lab9-mcp-finance-go | Go 1.21 | go modules | No `cmd/server/main.go` entry point committed yet |
| lab10-a2a-a2ui-renderer | TypeScript/React | npm | `npm start` (Node 18 required) |

### Key caveats

- **Node version**: lab10 requires Node 18 due to `react-scripts@5.0.1` compatibility. Use `source ~/.nvm/nvm.sh && nvm use 18` before running npm commands.
- **npm install flag**: lab10 requires `npm install --legacy-peer-deps` due to TypeScript 5 vs react-scripts peer dependency conflict.
- **Agent labs (2-6)** require `LLM_API_KEY`, `LLM_API_BASE`, and `LLM_MODEL` environment variables. Without these, the agents cannot connect to an LLM.
- **lab9 Go**: The `cmd/server/main.go` entry point referenced in the Dockerfile and README does not exist. The `internal/` packages compile and tests pass.

### Testing

- **lab1**: `PYTHONPATH=src uv run pytest test/` (from lab1 root) — 18/18 pass.
- **lab1 lint**: `uv run ruff check .` (reports E402/F541 style issues, non-blocking).
- **lab9**: `go test ./...` — all packages pass (calculations, validators, utils, tracing).
- **lab10**: `CI=true npx react-scripts test --watchAll=false --passWithNoTests`. Build: `npx react-scripts build`.
- **lab10 lint**: Uses eslint via react-scripts (no separate lint command).

### Running lab1 MCP server

The MCP server runs on port 8000 and responds to MCP protocol over streamable-http:
- MCP endpoint: `http://localhost:8000/mcp`
- Health: `http://localhost:8000/health`
- All 5 financial tools load successfully when started from the lab1 root directory.

### Running lab10 A2UI Renderer

Dev server on port 3000. Configure the A2A server URL in the UI header. The app is a chat frontend — it needs a running A2A agent backend to return meaningful responses (the MCP server alone is not an A2A server).
