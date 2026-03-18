# Git AI Agent (VS Code Extension)

This folder is **standalone** and intentionally separate from `frontend/` (web) and `gui_agent.py` (Tkinter GUI).

## What it does

- Adds a **Git AI Agent** icon to the VS Code Activity Bar
- Provides a **Chat** sidebar
- Automatically starts your local backend (`backend/main.py`) via `uvicorn`
- Sends chat messages to `POST /api/chat` and reads repo status from `GET /api/status`

## Prerequisites

- Node.js (recommended: 18+)
- Python with your backend deps installed:
  - `pip install -r backend/requirements.txt`

## Run in VS Code (development)

1. Open this repo in VS Code.
2. Open `vscode-extension/` in a terminal and install deps:

```bash
npm install
```

3. Build:

```bash
npm run build
```

4. Press `F5` in VS Code (Run Extension).
5. In the Extension Development Host, open the **Git AI Agent** sidebar and chat.

## Settings

- `gitAiAgent.backend.port` (default `8000`)
- `gitAiAgent.backend.pythonPath` (default `python`)
- `gitAiAgent.backend.autoStart` (default `true`)

