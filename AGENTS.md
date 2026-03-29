# AGENTS.md

## Cursor Cloud specific instructions

This is a monorepo of 10 independent lab projects for the cloud.ru AI Agents platform. Each lab is self-contained with its own dependencies and run commands.

### Architecture overview

| Lab | Language | Package Manager | Run Command |
|-----|----------|----------------|-------------|
| lab1-mcp-finance-lab | Python 3.12 | uv | `uv run python src/server.py` (from lab1 root) |
| lab2-adk-agent | Python 3.12 | uv | `uv run python src/start_a2a.py` (requires LLM_API_KEY) |
| lab3-langchain-agent | Python 3.12 | uv | `uv run python src/start_a2a.py` (requires LLM_API_KEY) |
| lab4-smolagents-agent | Python 3.12 | uv | `uv run python src/start_a2a.py` (requires LLM_API_KEY) |
| lab5-crewai-agent | Python 3.12 | uv | `uv run python src/start_a2a.py` (requires LLM_API_KEY) |
| lab6-strands-agent | Python 3.12 | uv | `uv run python src/start_a2a.py` (requires LLM_API_KEY) |
| lab7-mattermost-bot-for-agents | Python 3.12 | uv | Requires Mattermost server |
| lab8-telegram-bot-for-agents | Python 3.12 | uv | Requires Telegram bot token |
| lab9-mcp-finance-go | Go 1.21 | go modules | No `cmd/server/main.go` entry point committed yet |
| lab10-a2a-a2ui-renderer | TypeScript/React | npm | `npm start` (Node 18 required) |

### Key caveats

- **Node version**: lab10 requires Node 18 due to `react-scripts@5.0.1` compatibility. Use `source ~/.nvm/nvm.sh && nvm use 18` before running npm commands.
- **npm install flag**: lab10 requires `npm install --legacy-peer-deps` due to TypeScript 5 vs react-scripts peer dependency conflict.
- **lab1 tool imports**: The server starts but individual tool imports fail with `ImportError: attempted relative import beyond top-level package`. This is a pre-existing codebase issue — the FastMCP server framework still starts and responds to MCP protocol requests.
- **lab9 Go build**: The `cmd/server/main.go` entry point referenced in the Dockerfile and README does not exist in the repo. The `internal/` packages compile and tests pass. The `internal/tracing/tracing.go` has a pre-existing type mismatch (`ReadWriteSpan` vs `ReadOnlySpan`).
- **Agent labs (2-6)** require `LLM_API_KEY`, `LLM_API_BASE`, and `LLM_MODEL` environment variables to function. Without these, the agents cannot connect to an LLM.

### Testing

- **lab1**: `PYTHONPATH=src uv run pytest test/` (from lab1 root). 17/18 tests pass; 1 pre-existing failure in `test_basic_comparison`.
- **lab1 lint**: `uv run ruff check .` (reports pre-existing lint issues — E402, F401, F541).
- **lab9**: `go test ./...` — calculations, validators, utils tests pass. tracing package has a build error.
- **lab10**: `CI=true npx react-scripts test --watchAll=false --passWithNoTests` — no test files exist. Build: `npx react-scripts build`.
