# Git AI Agent

A local desktop assistant that lets you control Git with natural language, while showing a live visual commit graph.

The app combines:
- A Tkinter GUI chat interface (`gui_agent.py`)
- A stateful command router (`automation_engine.py`)
- A lightweight Git CLI wrapper (`git_tools.py`)

## What It Does

- Understands plain-language Git requests like `upload my code`, `switch to main`, `merge feature-x`, and `status`.
- Guides users through multi-step flows (for example: initialize repo, add remote URL, then push).
- Handles merge-conflict pauses and resumes when the user confirms conflicts are resolved.
- Auto-generates commit messages from local diff structure.
- Draws recent commit history in a clickable graph (click a node to checkout that commit).
- Refreshes branch, file-change stats, and Git identity in the sidebar.

## Project Structure

```text
.
|- gui_agent.py           # Tkinter GUI + visual graph + chat wiring
|- automation_engine.py   # Intent parsing + state machine flows
|- git_tools.py           # Git subprocess helpers
|- TECHNICAL_DOCS.md      # Extended architecture notes
|- agent.py               # Legacy CLI entry point (not main UX path)
|- state_model.py         # Legacy model file (currently stale)
|- decision_engine.py     # Legacy suggestion helper
```

## Requirements

- Python 3.10+ (stdlib only; no external Python packages required)
- Git installed and available on `PATH`
- A local Git repository (or let the assistant initialize one)

## Quick Start

```bash
python gui_agent.py
```

When the app opens:
1. Use `Open Repo` to select a project folder.
2. Type commands in the chat box.
3. Confirm guided actions with `y` / `yes` when prompted.

## Supported Commands

The parser is phrase-based, so close variants usually work.

- `upload`, `sync`, `save my changes`
- `status`, `what changed`
- `commit`, `record changes`
- `create branch <name>`, `new branch`
- `checkout <name>`, `switch to <name>`
- `merge <name>`
- `stash`, `stash pop`
- `config`, `who am i`, `set my name`
- `help`
- `clear`, `cls`

## Main Workflow: Upload/Sync

`upload` or `sync` triggers a guided flow:
1. Generate a commit message from current changes.
2. Stage and commit.
3. Pull from `origin/<current-branch>`.
4. If conflicts exist, pause and wait for `resolved`.
5. Push to `origin/<current-branch>`.

If no Git repo exists, it offers initialization.
If no remote exists, it asks for a remote URL and can push `main`.

## How Commit Messages Are Generated

Commit messages are heuristic, not LLM-based:
- It inspects `git diff` and `git diff --cached`.
- Extracts changed file paths using regex.
- Builds a template message depending on file count.

This is fast and local, but not semantically deep.

## Known Limitations

- Remote logic assumes `origin` as primary remote.
- Message generation is pattern-based and may produce generic text.
- Some legacy files (`state_model.py`, `agent.py`) are not aligned with the current GUI-first architecture.
- No automated test suite is included yet.

## Troubleshooting

- `fatal: not a git repository`
  - Open the correct folder, or run `upload` and confirm repo initialization.
- Push fails with authentication error
  - Configure your Git credentials/token outside the app (`git` itself handles auth).
- Wrong branch pushed
  - The app pushes the current branch returned by `git branch --show-current`.

## Extending the Project

Good upgrade points:
- Replace heuristic commit generation in `generate_commit_message()` with an LLM provider.
- Add multi-remote support (`origin` + `upstream` workflows).
- Add automated tests around `AutomationEngine.process()` state transitions.
- Add safer undo operations with explicit confirmations for hard resets.

## Safety Notes

This tool executes real Git commands in your selected repository. Review prompts before confirming operations like merge, push, or branch creation.
