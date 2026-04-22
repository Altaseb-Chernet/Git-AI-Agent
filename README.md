# Git AI Agent

Git AI Agent is a local-first Git assistant with three interfaces:
- Web app (React + Vite)
- Local API backend (FastAPI)
- VS Code extension (Activity Bar chat)

It helps you run common Git workflows through natural language while still using your local Git installation and repositories.

## Why This Project

Git AI Agent is designed for developers who want:
- A faster path for repetitive Git operations
- A guided chat interface for branch/sync workflows
- A visual commit graph without leaving their workspace

## Current Capabilities

- Repository connection and status inspection
- Natural-language intent parsing for common Git tasks
- Guided `upload/sync` flow (stage -> commit -> push)
- Branch operations (create, switch, list)
- Remote sync operations (fetch, pull --rebase)
- History operations (merge, rebase, cherry-pick + abort flows)
- Commit graph API + frontend visualization
- VS Code sidebar chat powered by the same backend

## Architecture

```text
User Interfaces
  |- frontend/ (React web app)
  |- vscode-extension/ (VS Code chat view)
  |- gui_agent.py (legacy Tkinter UI)

Backend
  |- backend/main.py (FastAPI app)
  |- backend/api/routes.py (chat + repo + graph endpoints)
  |- backend/core/ai_parser.py (heuristic NLP intent parser)
  |- backend/core/git_engine.py (safe Git subprocess wrapper)
  |- backend/core/state_manager.py (multi-step chat state)
```

## Repository Layout

```text
.
|- backend/
|  |- main.py
|  |- requirements.txt
|  |- api/routes.py
|  |- core/
|- frontend/
|  |- package.json
|  |- src/
|- vscode-extension/
|  |- package.json
|  |- src/
|- gui_agent.py                 # legacy desktop UI
|- automation_engine.py         # legacy engine
|- git_tools.py                 # legacy helpers
|- USER_MANUAL.md
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- Git installed and available on `PATH`
- A local Git repository to operate on

## Quick Start (Web App)

1. Start backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

2. Start frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

3. Open the Vite URL (usually `http://localhost:5173`).
4. In the app, choose your repository path from `Repository & Status`.

## Quick Start (VS Code Extension)

```bash
cd vscode-extension
npm install
npm run build
```

Then press `F5` in VS Code to launch an Extension Development Host.

Extension settings:
- `gitAiAgent.backend.port` (default: `8000`)
- `gitAiAgent.backend.pythonPath` (default: `python`)
- `gitAiAgent.backend.autoStart` (default: `true`)

## Natural Language Commands (Implemented)

Status and discovery:
- `status`, `what changed`, `check`
- `list branches`, `show branches`
- `fetch`
- `pull`

Branching:
- `create branch <name>`
- `switch to <name>`

Sync flow:
- `upload`, `sync`, `push`, `publish`

History operations:
- `merge <branch>`
- `rebase onto <branch>`
- `abort rebase`
- `cherry-pick <commit-hash>`
- `abort cherry-pick`

## Upload/Sync Behavior

When you send an upload intent, backend flow is:
1. Verify repository exists
2. Verify `origin` remote exists (asks for URL if missing)
3. `git add .`
4. Build commit message from staged diff
5. `git commit -m "..."`
6. `git push -u origin <current-branch>`

If no changes are staged, it exits safely without pushing.

## API Endpoints

Base path: `/api`

- `POST /chat` - parse intent and execute Git action
- `GET /status` - repo metadata + categorized working tree state
- `POST /set_repo` - set active repository path
- `GET /select_directory` - open native folder chooser
- `GET /graph` - commit topology for visualization

Health:
- `GET /` -> welcome message

## Configuration

Frontend:
- `VITE_API_URL` (optional, defaults to `http://localhost:8000/api`)

Backend:
- CORS is open (`*`) by default for local development.

## Safety Model

`backend/core/git_engine.py` validates commands before execution:
- Requires command to start with `git`
- Allows only a defined list of Git subcommands
- Uses subprocess with `shell=False`

This reduces command injection risk while keeping the tool local-first.

## Known Limitations

- Intent parser is regex-based and may misread ambiguous phrasing.
- Commit message generation is currently heuristic (placeholder text style).
- Pull/merge/rebase/cherry-pick require a clean working tree in many paths.
- `select_directory` depends on local GUI support (Tkinter dialog).
- Legacy Tkinter pipeline remains in the repo but is not the main architecture.

## Troubleshooting

Backend not reachable:
- Confirm backend is running on port `8000`.
- Check frontend `VITE_API_URL`.

`Not a git repository`:
- Use `Repository & Status` to point to a valid local repo.

Push fails:
- Ensure remote `origin` exists and credentials are configured in Git.

Directory dialog fails:
- Use manual path input in the repository field.

## Development Notes

Useful local commands:

```bash
# Backend
cd backend
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm run dev
npm run build

# VS Code extension
cd vscode-extension
npm run build
npm run watch
```

## Roadmap Ideas

- Replace regex parser with pluggable LLM provider
- Better commit message generation from semantic diff analysis
- Add automated tests for parser and route flows
- Improve multi-remote workflows (`origin` + `upstream`)
- Add auth-aware PR workflows (GitHub/GitLab)
